// @ts-nocheck
import { prisma } from "@/lib/prisma";
export const dynamic = 'force-dynamic';
import { NextResponse } from "next/server";

export async function GET() {
    try {
        // All Companies with Stats
        const companies = await prisma.companyMaster.findMany({
            where: { status: "active" },
            include: {
                _count: {
                    select: {
                        users: true,
                        orderMasters: true,
                        invoiceMaster: true,
                    },
                },
            },
        });

        // Revenue by Company
        const revenueByCompany = await prisma.$queryRaw<
            { company_id: number; company_name: string; revenue: number }[]
        >`
      SELECT 
        c.id as company_id,
        c.company_name,
        COALESCE(SUM(im.grand_total_amount), 0) as revenue
      FROM company_master c
      LEFT JOIN invoice_master im ON c.id = im.company_id
      WHERE c.status = 'active'
      GROUP BY c.id, c.company_name
      ORDER BY revenue DESC
    `;

        // Users by Company
        const usersByCompany = await prisma.userMaster.groupBy({
            by: ["companyId"],
            _count: { id: true },
        });

        // Orders by Company (Monthly)
        const ordersByCompany = await prisma.$queryRaw<
            { company_id: number; month: string; orders: bigint }[]
        >`
      SELECT 
        c.id as company_id,
        TO_CHAR(o.order_date, 'Mon YY') as month,
        COUNT(o.id) as orders
      FROM company_master c
      LEFT JOIN order_master o ON c.id = o.company_id
      WHERE o.order_date >= NOW() - INTERVAL '6 months'
      GROUP BY c.id, TO_CHAR(o.order_date, 'Mon YY'), DATE_TRUNC('month', o.order_date)
      ORDER BY DATE_TRUNC('month', o.order_date)
    `;

        // Company Performance Metrics
        const companyPerformance = await Promise.all(
            companies.map(async (company) => {
                const [orders, revenue, customers, pendingInvoices] = await Promise.all(
                    [
                        prisma.orderMaster.count({ where: { company_id: company.id } }),
                        prisma.invoiceMaster.aggregate({
                            _sum: { grand_total_amount: true },
                            where: { company_id: company.id },
                        }),
                        prisma.userMaster.count({
                            where: { companyId: company.id },
                        }),
                        prisma.invoiceMaster.count({
                            where: { company_id: company.id, payment_status: "UNPAID" },
                        }),
                    ]
                );

                return {
                    id: company.id,
                    name: company.company_name,
                    logo: company.company_logo_url,
                    email: company.company_email_main,
                    phone: company.company_mobile,
                    totalOrders: orders,
                    totalRevenue: Number(revenue._sum.grand_total_amount) || 0,
                    totalUsers: customers,
                    pendingInvoices,
                    status: company.status,
                };
            })
        );

        return NextResponse.json({
            companies: companyPerformance,
            summary: {
                totalCompanies: companies.length,
                totalUsers: usersByCompany.reduce((sum, u) => sum + u._count.id, 0),
                totalRevenue: revenueByCompany.reduce(
                    (sum, r) => sum + Number(r.revenue),
                    0
                ),
            },
            revenueByCompany: revenueByCompany.map((r) => ({
                companyId: r.company_id,
                companyName: r.company_name,
                revenue: Number(r.revenue),
            })),
            ordersByCompany: ordersByCompany.map((o) => ({
                companyId: o.company_id,
                month: o.month,
                orders: Number(o.orders),
            })),
        });
    } catch (error) {
        console.error("Company Dashboard Error:", error);
        return NextResponse.json(
            { error: "Failed to load company data" },
            { status: 500 }
        );
    }
}