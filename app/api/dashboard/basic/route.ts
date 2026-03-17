// @ts-nocheck
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { startOfMonth, subMonths, endOfMonth } from "date-fns";
export const dynamic = 'force-dynamic';
export async function GET() {
    try {
        const now = new Date();
        const currentMonthStart = startOfMonth(now);
        const lastMonthStart = startOfMonth(subMonths(now, 1));
        const lastMonthEnd = endOfMonth(subMonths(now, 1));

        // Basic Counts
        const [
            totalCustomers,
            totalOrders,
            totalSubscriptions,
            totalProducts,
            pendingOrders,
            activeSubscriptions,
        ] = await Promise.all([
            prisma.customerMaster.count({ where: { status: "ACTIVE" } }),
            prisma.orderMaster.count(),
            prisma.subscriptionMaster.count(),
            prisma.productMaster.count({ where: { status: "ACTIVE" } }),
            prisma.orderMaster.count({ where: { status: "PENDING" } }),
            prisma.subscriptionMaster.count({ where: { validity_status: "VALID" } }),
        ]);

        // Revenue Calculations
        const [currentMonthRevenue, lastMonthRevenue, totalRevenue] =
            await Promise.all([
                prisma.invoiceMaster.aggregate({
                    _sum: { grand_total_amount: true },
                    where: {
                        invoice_date: { gte: currentMonthStart },
                        status: { not: "CANCELLED" },
                    },
                }),
                prisma.invoiceMaster.aggregate({
                    _sum: { grand_total_amount: true },
                    where: {
                        invoice_date: { gte: lastMonthStart, lte: lastMonthEnd },
                        status: { not: "CANCELLED" },
                    },
                }),
                prisma.invoiceMaster.aggregate({
                    _sum: { grand_total_amount: true },
                    where: { status: { not: "CANCELLED" } },
                }),
            ]);

        // Orders by Month (Last 6 months)
        const ordersByMonth = await prisma.$queryRaw<
            { month: string; total: bigint; revenue: number }[]
        >`
      SELECT 
        TO_CHAR(order_date, 'Mon YY') as month,
        COUNT(*) as total,
        COALESCE(SUM(grand_total_amount), 0) as revenue
      FROM order_master
      WHERE order_date >= NOW() - INTERVAL '6 months'
      GROUP BY TO_CHAR(order_date, 'Mon YY'), DATE_TRUNC('month', order_date)
      ORDER BY DATE_TRUNC('month', order_date)
    `;

        // Order Status Distribution
        const orderStatusDistribution = await prisma.orderMaster.groupBy({
            by: ["status"],
            _count: { id: true },
        });

        // Recent Orders
        const recentOrders = await prisma.orderMaster.findMany({
            take: 5,
            orderBy: { created_at: "desc" },
            include: {
                customer: { select: { customer_name: true, customer_code: true } },
            },
        });

        // Top Customers by Revenue
        const topCustomers = await prisma.$queryRaw<
            {
                id: number;
                customer_name: string;
                customer_code: string;
                total_orders: bigint;
                total_revenue: number;
            }[]
        >`
      SELECT 
        c.id,
        c.customer_name,
        c.customer_code,
        COUNT(o.id) as total_orders,
        COALESCE(SUM(o.grand_total_amount), 0) as total_revenue
      FROM customer_master c
      LEFT JOIN order_master o ON c.id = o.customer_id
      WHERE c.status = 'ACTIVE'
      GROUP BY c.id, c.customer_name, c.customer_code
      ORDER BY total_revenue DESC
      LIMIT 5
    `;

        return NextResponse.json({
            stats: {
                totalCustomers,
                totalOrders,
                totalSubscriptions,
                totalProducts,
                pendingOrders,
                activeSubscriptions,
                monthlyRevenue: Number(currentMonthRevenue._sum.grand_total_amount) || 0,
                totalRevenue: Number(totalRevenue._sum.grand_total_amount) || 0,
                revenueGrowth: calculateGrowth(
                    Number(currentMonthRevenue._sum.grand_total_amount) || 0,
                    Number(lastMonthRevenue._sum.grand_total_amount) || 0
                ),
            },
            charts: {
                ordersByMonth: ordersByMonth.map((o) => ({
                    month: o.month,
                    orders: Number(o.total),
                    revenue: Number(o.revenue),
                })),
                orderStatusDistribution: orderStatusDistribution.map((s) => ({
                    status: s.status,
                    count: s._count.id,
                })),
            },
            tables: {
                recentOrders: recentOrders.map((o) => ({
                    id: o.id,
                    voucherNo: o.order_voucher_no,
                    customer: o.customer.customer_name,
                    customerCode: o.customer.customer_code,
                    amount: Number(o.grand_total_amount),
                    status: o.status,
                    date: o.order_date,
                })),
                topCustomers: topCustomers.map((c) => ({
                    id: c.id,
                    name: c.customer_name,
                    code: c.customer_code,
                    totalOrders: Number(c.total_orders),
                    totalRevenue: Number(c.total_revenue),
                })),
            },
        });
    } catch (error) {
        console.error("Dashboard Error:", error);
        return NextResponse.json(
            { error: "Failed to load dashboard" },
            { status: 500 }
        );
    }
}

function calculateGrowth(current: number, previous: number) {
    if (previous === 0) return { value: 0, isPositive: true };
    const percentage = ((current - previous) / previous) * 100;
    return {
        value: Math.abs(percentage),
        isPositive: percentage >= 0,
    };
}