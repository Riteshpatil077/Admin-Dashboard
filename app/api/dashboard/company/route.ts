// @ts-nocheck
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// Fix BigInt serialization
(BigInt.prototype as any).toJSON = function () {
    return Number(this);
};

export async function GET() {
    try {
        // ✅ All Companies with correct relation names from schema
        const companies = await prisma.companyMaster.findMany({
            where: { status: "active" },
            include: {
                _count: {
                    select: {
                        user_master: true,     // ✅ Correct: schema has user_master[]
                        orderMasters: true,    // ✅ Correct: schema has orderMasters[]
                        invoiceMaster: true,   // ✅ Correct: schema has invoiceMaster[]
                    },
                },
            },
        });

        // ✅ Revenue by Company via raw SQL with proper casting
        const revenueByCompany = await prisma.$queryRaw<
            { company_id: number; company_name: string; revenue: number }[]
        >`
            SELECT 
                c.id as company_id,
                c.company_name,
                COALESCE(SUM(im.grand_total_amount), 0)::float as revenue
            FROM company_master c
            LEFT JOIN invoice_master im 
                ON c.id = im.company_id
                AND im.status != 'CANCELLED'
            WHERE c.status = 'active'
            GROUP BY c.id, c.company_name
            ORDER BY revenue DESC
        `.catch((err) => {
            console.error("❌ Revenue by Company Error:", err);
            return [];
        });

        // ✅ Users by Company - correct model name is user_master
        const usersByCompany = await prisma.user_master.groupBy({
            by: ["companyId"],
            _count: { id: true },
        }).catch((err) => {
            console.error("❌ Users by Company Error:", err);
            return [];
        });

        // ✅ Orders by Company Monthly - Fixed SQL
        const ordersByCompany = await prisma.$queryRaw<
            { company_id: number; month: string; orders: number }[]
        >`
            SELECT 
                c.id as company_id,
                TO_CHAR(o.order_date, 'Mon YY') as month,
                COUNT(o.id)::int as orders
            FROM company_master c
            INNER JOIN order_master o ON c.id = o.company_id
            WHERE o.order_date >= NOW() - INTERVAL '6 months'
                AND c.status = 'active'
            GROUP BY c.id, TO_CHAR(o.order_date, 'Mon YY'), DATE_TRUNC('month', o.order_date)
            ORDER BY DATE_TRUNC('month', o.order_date)
        `.catch((err) => {
            console.error("❌ Orders by Company Error:", err);
            return [];
        });

        // ✅ Company Performance Metrics
        const companyPerformance = await Promise.all(
            companies.map(async (company) => {
                const [
                    orders,
                    revenue,
                    users,
                    pendingInvoices,
                    paidInvoices,
                    partialInvoices,
                ] = await Promise.all([
                    // Total orders for company
                    prisma.orderMaster.count({
                        where: { company_id: company.id },
                    }).catch(() => 0),

                    // Total revenue from invoices
                    prisma.invoiceMaster.aggregate({
                        _sum: {
                            grand_total_amount: true,
                            paid_amount: true,
                            balance_due: true,
                        },
                        where: {
                            company_id: company.id,
                            status: { not: "CANCELLED" },
                        },
                    }).catch(() => ({
                        _sum: {
                            grand_total_amount: null,
                            paid_amount: null,
                            balance_due: null,
                        }
                    })),

                    // Total users in company
                    prisma.user_master.count({
                        where: { companyId: company.id },
                    }).catch(() => 0),

                    // Unpaid invoices count
                    prisma.invoiceMaster.count({
                        where: {
                            company_id: company.id,
                            payment_status: "UNPAID",
                        },
                    }).catch(() => 0),

                    // Paid invoices count
                    prisma.invoiceMaster.count({
                        where: {
                            company_id: company.id,
                            payment_status: "PAID",
                        },
                    }).catch(() => 0),

                    // Partial invoices count
                    prisma.invoiceMaster.count({
                        where: {
                            company_id: company.id,
                            payment_status: "PARTIAL",
                        },
                    }).catch(() => 0),
                ]);

                // ✅ Calculate collection rate
                const totalRevenue = Number(revenue._sum.grand_total_amount || 0);
                const totalPaid = Number(revenue._sum.paid_amount || 0);
                const totalDue = Number(revenue._sum.balance_due || 0);
                const collectionRate = totalRevenue > 0
                    ? ((totalPaid / totalRevenue) * 100).toFixed(2)
                    : "0.00";

                return {
                    id: company.id,
                    name: company.company_name,
                    logo: company.company_logo_url || null,
                    email: company.company_email_main || null,
                    phone: company.company_mobile || null,
                    address: company.company_address || null,
                    gstin: company.company_gstin || null,
                    website: company.company_website || null,
                    totalOrders: orders,
                    totalRevenue: totalRevenue,
                    totalPaid: totalPaid,
                    totalDue: totalDue,
                    totalUsers: users,
                    pendingInvoices,
                    paidInvoices,
                    partialInvoices,
                    collectionRate: Number(collectionRate),
                    status: company.status,
                    // ✅ From _count include
                    orderCount: company._count.orderMasters,
                    invoiceCount: company._count.invoiceMaster,
                    userCount: company._count.user_master,
                };
            })
        );

        // ✅ Summary aggregations
        const totalOrdersSum = companyPerformance.reduce(
            (sum, c) => sum + c.totalOrders, 0
        );
        const totalRevenueSum = companyPerformance.reduce(
            (sum, c) => sum + c.totalRevenue, 0
        );
        const totalUsersSum = usersByCompany.reduce(
            (sum, u) => sum + u._count.id, 0
        );

        // ✅ Revenue trend for chart (last 6 months across all companies)
        const revenueTrend = await prisma.$queryRaw<
            { month: string; revenue: number; invoices: number }[]
        >`
            SELECT 
                TO_CHAR(invoice_date, 'Mon YY') as month,
                COALESCE(SUM(grand_total_amount), 0)::float as revenue,
                COUNT(id)::int as invoices
            FROM invoice_master
            WHERE invoice_date >= NOW() - INTERVAL '6 months'
                AND status != 'CANCELLED'
            GROUP BY TO_CHAR(invoice_date, 'Mon YY'), DATE_TRUNC('month', invoice_date)
            ORDER BY DATE_TRUNC('month', invoice_date)
        `.catch((err) => {
            console.error("❌ Revenue Trend Error:", err);
            return [];
        });

        // ✅ Payment status overview across all companies
        const paymentOverview = await prisma.invoiceMaster.groupBy({
            by: ["payment_status"],
            _count: { id: true },
            _sum: { grand_total_amount: true, balance_due: true },
        }).catch(() => []);

        return NextResponse.json({
            companies: companyPerformance,
            summary: {
                totalCompanies: companies.length,
                totalUsers: totalUsersSum,
                totalRevenue: totalRevenueSum,
                totalOrders: totalOrdersSum,
                totalInvoices: companyPerformance.reduce(
                    (sum, c) => sum + c.invoiceCount, 0
                ),
                totalDue: companyPerformance.reduce(
                    (sum, c) => sum + c.totalDue, 0
                ),
            },
            revenueByCompany: (revenueByCompany || []).map((r) => ({
                companyId: Number(r.company_id),
                companyName: r.company_name,
                revenue: Number(r.revenue),
            })),
            ordersByCompany: (ordersByCompany || []).map((o) => ({
                companyId: Number(o.company_id),
                month: o.month,
                orders: Number(o.orders),
            })),
            revenueTrend: (revenueTrend || []).map((r) => ({
                month: r.month,
                revenue: Number(r.revenue),
                invoices: Number(r.invoices),
            })),
            paymentOverview: (paymentOverview || []).map((p) => ({
                status: p.payment_status,
                count: Number(p._count.id),
                amount: Number(p._sum.grand_total_amount || 0),
                balanceDue: Number(p._sum.balance_due || 0),
            })),
        });

    } catch (error) {
        console.error("❌ Company Dashboard Error:", error);
        return NextResponse.json(
            {
                error: "Failed to load company data",
                details: error instanceof Error ? error.message : String(error),
                // ✅ Return empty structure to prevent frontend crash
                companies: [],
                summary: {
                    totalCompanies: 0,
                    totalUsers: 0,
                    totalRevenue: 0,
                    totalOrders: 0,
                    totalInvoices: 0,
                    totalDue: 0,
                },
                revenueByCompany: [],
                ordersByCompany: [],
                revenueTrend: [],
                paymentOverview: [],
            },
            { status: 500 }
        );
    }
}