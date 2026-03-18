// @ts-nocheck
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { startOfMonth, subMonths, endOfMonth } from "date-fns";

export const runtime = 'nodejs';
export const dynamic = "force-dynamic";
export const revalidate = 0;

// ✅ FIX: Add BigInt serialization
(BigInt.prototype as any).toJSON = function () {
    return Number(this);
};

export async function GET(req: Request) {
    try {
        const now = new Date();
        const currentMonthStart = startOfMonth(now);
        const lastMonthStart = startOfMonth(subMonths(now, 1));
        const lastMonthEnd = endOfMonth(subMonths(now, 1));

        // 1. Basic Counts - Added fallback to 0
        const [
            totalCustomers,
            totalOrders,
            totalSubscriptions,
            totalProducts,
            pendingOrders,
            activeSubscriptions,
        ] = await Promise.all([
            prisma.customerMaster.count({ where: { status: "ACTIVE" } }).catch(() => 0),
            prisma.orderMaster.count().catch(() => 0),
            prisma.subscription_master.count().catch(() => 0), // ✅ FIX: Use correct model name
            prisma.productMaster.count({ where: { status: "ACTIVE" } }).catch(() => 0),
            prisma.orderMaster.count({ where: { status: "PENDING" } }).catch(() => 0),
            prisma.subscription_master.count({
                where: { validity_status: "VALID" }
            }).catch(() => 0), // ✅ FIX: Use correct model name
        ]);

        // 2. Revenue Calculations
        const [currentMonthRevenue, lastMonthRevenue, totalRevenue] = await Promise.all([
            prisma.invoiceMaster.aggregate({
                _sum: { grand_total_amount: true },
                where: {
                    invoice_date: { gte: currentMonthStart },
                    status: { not: "CANCELLED" },
                },
            }).catch(() => ({ _sum: { grand_total_amount: null } })),
            prisma.invoiceMaster.aggregate({
                _sum: { grand_total_amount: true },
                where: {
                    invoice_date: { gte: lastMonthStart, lte: lastMonthEnd },
                    status: { not: "CANCELLED" },
                },
            }).catch(() => ({ _sum: { grand_total_amount: null } })),
            prisma.invoiceMaster.aggregate({
                _sum: { grand_total_amount: true },
                where: { status: { not: "CANCELLED" } },
            }).catch(() => ({ _sum: { grand_total_amount: null } })),
        ]);

        // 3. Orders by Month (Raw Query) - ✅ FIX: Cast to int/float
        const ordersByMonth = await prisma.$queryRaw<
            { month: string; total: number; revenue: number }[]
        >`
            SELECT 
                TO_CHAR(order_date, 'Mon YY') as month,
                COUNT(*)::int as total,
                COALESCE(SUM(grand_total_amount), 0)::float as revenue
            FROM order_master
            WHERE order_date >= NOW() - INTERVAL '6 months'
            GROUP BY TO_CHAR(order_date, 'Mon YY'), DATE_TRUNC('month', order_date)
            ORDER BY DATE_TRUNC('month', order_date)
        `.catch((err) => {
            console.error("Orders by Month Error:", err);
            return [];
        });

        // 4. Order Status Distribution
        const orderStatusDistribution = await prisma.orderMaster.groupBy({
            by: ["status"],
            _count: { id: true },
        }).catch(() => []);

        // 5. Recent Orders
        const recentOrders = await prisma.orderMaster.findMany({
            take: 5,
            orderBy: { created_at: "desc" },
            include: {
                customer: {
                    select: {
                        customer_name: true,
                        customer_code: true
                    }
                },
            },
        }).catch((err) => {
            console.error("Recent Orders Error:", err);
            return [];
        });

        // 6. Top Customers - ✅ FIX: Cast to proper types
        const topCustomers = await prisma.$queryRaw<
            {
                id: number;
                customer_name: string;
                customer_code: string;
                total_orders: number;
                total_revenue: number;
            }[]
        >`
            SELECT 
                c.id,
                c.customer_name,
                c.customer_code,
                COUNT(o.id)::int as total_orders,
                COALESCE(SUM(o.grand_total_amount), 0)::float as total_revenue
            FROM customer_master c
            LEFT JOIN order_master o ON c.id = o.customer_id
            WHERE c.status = 'ACTIVE'
            GROUP BY c.id, c.customer_name, c.customer_code
            ORDER BY total_revenue DESC
            LIMIT 5
        `.catch((err) => {
            console.error("Top Customers Error:", err);
            return [];
        });

        // ✅ Final Response Construction
        const responseData = {
            stats: {
                totalCustomers: totalCustomers || 0,
                totalOrders: totalOrders || 0,
                totalSubscriptions: totalSubscriptions || 0,
                totalProducts: totalProducts || 0,
                pendingOrders: pendingOrders || 0,
                activeSubscriptions: activeSubscriptions || 0,
                monthlyRevenue: Number(currentMonthRevenue?._sum?.grand_total_amount ?? 0),
                totalRevenue: Number(totalRevenue?._sum?.grand_total_amount ?? 0),
                revenueGrowth: calculateGrowth(
                    Number(currentMonthRevenue?._sum?.grand_total_amount ?? 0),
                    Number(lastMonthRevenue?._sum?.grand_total_amount ?? 0)
                ),
            },
            charts: {
                ordersByMonth: (ordersByMonth || []).map((o) => ({
                    month: o.month,
                    orders: Number(o.total || 0),
                    revenue: Number(o.revenue || 0),
                })),
                orderStatusDistribution: (orderStatusDistribution || []).map((s) => ({
                    status: s.status,
                    count: s._count?.id || 0,
                })),
            },
            tables: {
                recentOrders: (recentOrders || []).map((o) => ({
                    id: o.id,
                    voucherNo: o.order_voucher_no,
                    customer: o.customer?.customer_name || "Unknown",
                    customerCode: o.customer?.customer_code || "N/A",
                    amount: Number(o.grand_total_amount || 0),
                    status: o.status,
                    date: o.order_date,
                })),
                topCustomers: (topCustomers || []).map((c) => ({
                    id: c.id,
                    name: c.customer_name,
                    code: c.customer_code,
                    totalOrders: Number(c.total_orders || 0),
                    totalRevenue: Number(c.total_revenue || 0),
                })),
            },
        };

        return NextResponse.json(responseData, {
            headers: { "Cache-Control": "no-store, max-age=0" },
        });

    } catch (error) {
        console.error("❌ Dashboard API Error:", error);
        // Return proper error structure
        return NextResponse.json(
            {
                error: "Failed to load dashboard data",
                details: error instanceof Error ? error.message : String(error),
                stats: {
                    totalCustomers: 0,
                    totalOrders: 0,
                    totalSubscriptions: 0,
                    totalProducts: 0,
                    pendingOrders: 0,
                    activeSubscriptions: 0,
                    monthlyRevenue: 0,
                    totalRevenue: 0,
                    revenueGrowth: { value: 0, isPositive: true }
                },
                charts: {
                    ordersByMonth: [],
                    orderStatusDistribution: []
                },
                tables: {
                    recentOrders: [],
                    topCustomers: []
                }
            },
            { status: 500 }
        );
    }
}

function calculateGrowth(current: number, previous: number) {
    if (!previous || previous === 0) return { value: 0, isPositive: true };
    const percentage = ((current - previous) / previous) * 100;
    return {
        value: Math.abs(Number(percentage.toFixed(2))),
        isPositive: percentage >= 0,
    };
}