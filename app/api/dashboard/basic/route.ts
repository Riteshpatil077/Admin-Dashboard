// @ts-nocheck
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { startOfMonth, subMonths, endOfMonth, startOfYear } from "date-fns";

export const runtime = 'nodejs';
export const dynamic = "force-dynamic";
export const revalidate = 0;

// Fix BigInt serialization
(BigInt.prototype as any).toJSON = function () {
    return Number(this);
};

export async function GET(req: Request) {
    try {
        const now = new Date();
        const currentMonthStart = startOfMonth(now);
        const lastMonthStart = startOfMonth(subMonths(now, 1));
        const lastMonthEnd = endOfMonth(subMonths(now, 1));
        const sixMonthsAgo = subMonths(now, 6);

        // ─────────────────────────────────────────
        // 1. BASIC COUNTS
        // ─────────────────────────────────────────
        const [
            totalCustomers,
            totalOrders,
            totalSubscriptions,
            totalProducts,
            pendingOrders,
            activeSubscriptions,
            totalInvoices,
            unpaidInvoices,
            totalReceipts,
        ] = await Promise.all([
            prisma.customerMaster
                .count({ where: { status: "ACTIVE" } })
                .catch(() => 0),

            prisma.orderMaster
                .count()
                .catch(() => 0),

            // ✅ Correct model: subscription_master (snake_case in schema)
            prisma.subscription_master
                .count()
                .catch(() => 0),

            prisma.productMaster
                .count({ where: { status: "ACTIVE" } })
                .catch(() => 0),

            prisma.orderMaster
                .count({ where: { status: "PENDING" } })
                .catch(() => 0),

            // ✅ validity_status field exists in subscription_master
            prisma.subscription_master
                .count({ where: { validity_status: "VALID" } })
                .catch(() => 0),

            // ✅ invoice_master status: ISSUED / CANCELLED
            prisma.invoiceMaster
                .count({ where: { status: { not: "CANCELLED" } } })
                .catch(() => 0),

            // ✅ payment_status: UNPAID / PARTIAL / PAID
            prisma.invoiceMaster
                .count({ where: { payment_status: "UNPAID" } })
                .catch(() => 0),

            prisma.receiptMaster
                .count({ where: { status: "CLEARED" } })
                .catch(() => 0),
        ]);

        // ─────────────────────────────────────────
        // 2. REVENUE CALCULATIONS
        // ─────────────────────────────────────────
        const [
            currentMonthRevenue,
            lastMonthRevenue,
            totalRevenue,
            totalBalanceDue,
            totalPaidAmount,
        ] = await Promise.all([
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

            // ✅ balance_due field exists in invoice_master
            prisma.invoiceMaster.aggregate({
                _sum: { balance_due: true },
                where: {
                    payment_status: { in: ["UNPAID", "PARTIAL"] },
                    status: { not: "CANCELLED" },
                },
            }).catch(() => ({ _sum: { balance_due: null } })),

            // ✅ paid_amount field exists in invoice_master
            prisma.invoiceMaster.aggregate({
                _sum: { paid_amount: true },
                where: { status: { not: "CANCELLED" } },
            }).catch(() => ({ _sum: { paid_amount: null } })),
        ]);

        // ─────────────────────────────────────────
        // 3. ORDERS BY MONTH (last 6 months)
        // ─────────────────────────────────────────
        const ordersByMonth = await prisma.$queryRaw<
            { month: string; total: number; revenue: number }[]
        >`
            SELECT 
                TO_CHAR(order_date, 'Mon YY') AS month,
                COUNT(*)::int AS total,
                COALESCE(SUM(grand_total_amount), 0)::float AS revenue
            FROM order_master
            WHERE order_date >= ${sixMonthsAgo}::date
            GROUP BY 
                TO_CHAR(order_date, 'Mon YY'), 
                DATE_TRUNC('month', order_date)
            ORDER BY DATE_TRUNC('month', order_date) ASC
        `.catch((err) => {
            console.error("❌ Orders by Month Error:", err.message);
            return [];
        });

        // ─────────────────────────────────────────
        // 4. ORDER STATUS DISTRIBUTION
        // ─────────────────────────────────────────
        const orderStatusDistribution = await prisma.orderMaster
            .groupBy({
                by: ["status"],
                _count: { id: true },
                orderBy: { _count: { id: "desc" } },
            })
            .catch(() => []);

        // ─────────────────────────────────────────
        // 5. INVOICE PAYMENT STATUS DISTRIBUTION
        // ─────────────────────────────────────────
        const invoicePaymentStatus = await prisma.invoiceMaster
            .groupBy({
                by: ["payment_status"],
                _count: { id: true },
                _sum: { grand_total_amount: true, balance_due: true },
                where: { status: { not: "CANCELLED" } },
            })
            .catch(() => []);

        // ─────────────────────────────────────────
        // 6. RECENT ORDERS (last 5)
        // ─────────────────────────────────────────
        const recentOrders = await prisma.orderMaster
            .findMany({
                take: 5,
                orderBy: { created_at: "desc" },
                include: {
                    // ✅ Correct relation name from schema: customer
                    customer: {
                        select: {
                            customer_name: true,
                            customer_code: true,
                        },
                    },
                    // ✅ Correct relation: company
                    company: {
                        select: { company_name: true },
                    },
                },
            })
            .catch((err) => {
                console.error("❌ Recent Orders Error:", err.message);
                return [];
            });

        // ─────────────────────────────────────────
        // 7. RECENT SUBSCRIPTIONS (last 5)
        // ─────────────────────────────────────────
        const recentSubscriptions = await prisma.subscription_master
            .findMany({
                take: 5,
                orderBy: { created_at: "desc" },
                include: {
                    // ✅ Correct relation from schema
                    customer_contact_detail_master: {
                        select: {
                            contact_person_name: true,
                            customer_master: {
                                select: {
                                    customer_name: true,
                                    customer_code: true,
                                },
                            },
                        },
                    },
                    subscription_period_master: {
                        select: {
                            period_value: true,
                            period_type: true,
                        },
                    },
                },
            })
            .catch((err) => {
                console.error("❌ Recent Subscriptions Error:", err.message);
                return [];
            });

        // ─────────────────────────────────────────
        // 8. TOP CUSTOMERS BY REVENUE
        // ─────────────────────────────────────────
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
                COUNT(DISTINCT o.id)::int AS total_orders,
                COALESCE(SUM(o.grand_total_amount), 0)::float AS total_revenue
            FROM customer_master c
            LEFT JOIN order_master o ON c.id = o.customer_id
            WHERE c.status = 'ACTIVE'
            GROUP BY c.id, c.customer_name, c.customer_code
            ORDER BY total_revenue DESC
            LIMIT 5
        `.catch((err) => {
            console.error("❌ Top Customers Error:", err.message);
            return [];
        });

        // ─────────────────────────────────────────
        // 9. SUBSCRIPTION BY STATUS
        // ─────────────────────────────────────────
        const subscriptionByStatus = await prisma.subscription_master
            .groupBy({
                by: ["validity_status"],
                _count: { id: true },
                _sum: { grand_total_amount: true },
            })
            .catch(() => []);

        // ─────────────────────────────────────────
        // 10. RECENT RECEIPTS
        // ─────────────────────────────────────────
        const recentReceipts = await prisma.$queryRaw<
            {
                id: number;
                receipt_voucher_no: string;
                customer_name: string;
                total_amount: number;
                mode: string;
                receipt_date: Date;
                status: string;
            }[]
        >`
            SELECT 
                rm.id,
                rm.receipt_voucher_no,
                rm.total_amount::float,
                rm.mode,
                rm.receipt_date,
                rm.status,
                cm.customer_name
            FROM receipt_master rm
            LEFT JOIN customer_master cm ON rm.customer_id = cm.id
            WHERE rm.status = 'CLEARED'
            ORDER BY rm.created_at DESC
            LIMIT 5
        `.catch((err) => {
            console.error("❌ Recent Receipts Error:", err.message);
            return [];
        });

        // ─────────────────────────────────────────
        // CALCULATE GROWTH
        // ─────────────────────────────────────────
        const currentRev = Number(
            currentMonthRevenue?._sum?.grand_total_amount ?? 0
        );
        const lastRev = Number(
            lastMonthRevenue?._sum?.grand_total_amount ?? 0
        );
        const totalRev = Number(totalRevenue?._sum?.grand_total_amount ?? 0);
        const totalDue = Number(totalBalanceDue?._sum?.balance_due ?? 0);
        const totalPaid = Number(totalPaidAmount?._sum?.paid_amount ?? 0);

        // Collection rate
        const collectionRate =
            totalRev > 0
                ? Number(((totalPaid / totalRev) * 100).toFixed(2))
                : 0;

        // ─────────────────────────────────────────
        // FINAL RESPONSE
        // ─────────────────────────────────────────
        return NextResponse.json(
            {
                stats: {
                    totalCustomers: totalCustomers || 0,
                    totalOrders: totalOrders || 0,
                    totalSubscriptions: totalSubscriptions || 0,
                    totalProducts: totalProducts || 0,
                    pendingOrders: pendingOrders || 0,
                    activeSubscriptions: activeSubscriptions || 0,
                    totalInvoices: totalInvoices || 0,
                    unpaidInvoices: unpaidInvoices || 0,
                    totalReceipts: totalReceipts || 0,
                    monthlyRevenue: currentRev,
                    totalRevenue: totalRev,
                    totalDue: totalDue,
                    totalPaid: totalPaid,
                    collectionRate: collectionRate,
                    revenueGrowth: calculateGrowth(currentRev, lastRev),
                },
                charts: {
                    ordersByMonth: (ordersByMonth || []).map((o) => ({
                        month: o.month,
                        orders: Number(o.total || 0),
                        revenue: Number(o.revenue || 0),
                    })),
                    orderStatusDistribution: (orderStatusDistribution || []).map(
                        (s) => ({
                            status: s.status,
                            count: Number(s._count?.id || 0),
                        })
                    ),
                    invoicePaymentStatus: (invoicePaymentStatus || []).map((p) => ({
                        status: p.payment_status,
                        count: Number(p._count?.id || 0),
                        amount: Number(p._sum?.grand_total_amount || 0),
                        balanceDue: Number(p._sum?.balance_due || 0),
                    })),
                    subscriptionByStatus: (subscriptionByStatus || []).map((s) => ({
                        status: s.validity_status,
                        count: Number(s._count?.id || 0),
                        revenue: Number(s._sum?.grand_total_amount || 0),
                    })),
                },
                tables: {
                    recentOrders: (recentOrders || []).map((o) => ({
                        id: o.id,
                        voucherNo: o.order_voucher_no,
                        customer: o.customer?.customer_name || "Unknown",
                        customerCode: o.customer?.customer_code || "N/A",
                        company: o.company?.company_name || "N/A",
                        amount: Number(o.grand_total_amount || 0),
                        status: o.status,
                        date: o.order_date,
                        isComplementary: o.is_complementary,
                    })),
                    recentSubscriptions: (recentSubscriptions || []).map((s) => ({
                        id: s.id,
                        voucherNo: s.subscription_voucher_no,
                        customer:
                            s.customer_contact_detail_master?.customer_master
                                ?.customer_name || "Unknown",
                        customerCode:
                            s.customer_contact_detail_master?.customer_master
                                ?.customer_code || "N/A",
                        period: s.subscription_period_master
                            ? `${s.subscription_period_master.period_value} ${s.subscription_period_master.period_type}`
                            : "N/A",
                        amount: Number(s.grand_total_amount || 0),
                        status: s.status,
                        validityStatus: s.validity_status,
                        startDate: s.subscription_start_date,
                        validUpto: s.valid_upto_date,
                    })),
                    topCustomers: (topCustomers || []).map((c) => ({
                        id: c.id,
                        name: c.customer_name,
                        code: c.customer_code,
                        totalOrders: Number(c.total_orders || 0),
                        totalRevenue: Number(c.total_revenue || 0),
                    })),
                    recentReceipts: (recentReceipts || []).map((r) => ({
                        id: r.id,
                        voucherNo: r.receipt_voucher_no,
                        customer: r.customer_name || "Unknown",
                        amount: Number(r.total_amount || 0),
                        mode: r.mode,
                        date: r.receipt_date,
                        status: r.status,
                    })),
                },
            },
            {
                headers: { "Cache-Control": "no-store, max-age=0" },
            }
        );
    } catch (error) {
        console.error("❌ Dashboard API Error:", error);
        return NextResponse.json(
            {
                error: "Failed to load dashboard data",
                details:
                    error instanceof Error ? error.message : String(error),
                stats: {
                    totalCustomers: 0,
                    totalOrders: 0,
                    totalSubscriptions: 0,
                    totalProducts: 0,
                    pendingOrders: 0,
                    activeSubscriptions: 0,
                    totalInvoices: 0,
                    unpaidInvoices: 0,
                    totalReceipts: 0,
                    monthlyRevenue: 0,
                    totalRevenue: 0,
                    totalDue: 0,
                    totalPaid: 0,
                    collectionRate: 0,
                    revenueGrowth: { value: 0, isPositive: true },
                },
                charts: {
                    ordersByMonth: [],
                    orderStatusDistribution: [],
                    invoicePaymentStatus: [],
                    subscriptionByStatus: [],
                },
                tables: {
                    recentOrders: [],
                    recentSubscriptions: [],
                    topCustomers: [],
                    recentReceipts: [],
                },
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