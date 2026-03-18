// @ts-nocheck
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

(BigInt.prototype as any).toJSON = function () {
    return Number(this);
};

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const startDate = searchParams.get("startDate")
            ? new Date(searchParams.get("startDate")!)
            : new Date(new Date().setDate(new Date().getDate() - 30));
        const endDate = searchParams.get("endDate")
            ? new Date(searchParams.get("endDate")!)
            : new Date();
        const companyId = searchParams.get("companyId") || "all";

        const companyFilter =
            companyId !== "all" ? { company_id: Number(companyId) } : {};

        // Total Receivables (UNPAID/PARTIAL inside range)
        const totalReceivables = await prisma.invoiceMaster.aggregate({
            _sum: { balance_due: true },
            where: {
                payment_status: { in: ["UNPAID", "PARTIAL"] },
                invoice_date: { gte: startDate, lte: endDate },
                ...companyFilter,
            },
        });

        // Total Received (Receipts in range)
        const totalReceived = await prisma.receiptMaster.aggregate({
            _sum: { total_amount: true },
            where: {
                status: "CLEARED",
                receipt_date: { gte: startDate, lte: endDate },
            },
        });

        // Payment Modes
        const paymentModes = await prisma.receiptMaster.groupBy({
            by: ["mode", "sub_mode"],
            _count: { id: true },
            _sum: { total_amount: true },
            where: {
                receipt_date: { gte: startDate, lte: endDate },
                status: "CLEARED",
            },
        });

        // Advance Balance (Unused)
        const advanceBalance = await prisma.receiptMaster.aggregate({
            _sum: { unused_amount: true },
            where: {
                unused_amount: { gt: 0 },
            },
        });

        // Payment Status Distribution
        const paymentStatusDist = await prisma.invoiceMaster.groupBy({
            by: ["payment_status"],
            _count: { id: true },
            _sum: { grand_total_amount: true },
            where: {
                ...companyFilter,
                invoice_date: { gte: startDate, lte: endDate },
            },
        });

        // Invoice Aging
        const invoiceAging = await prisma.$queryRaw`
            SELECT 
                CASE 
                    WHEN invoice_date >= NOW() - INTERVAL '30 days' THEN '0-30 Days'
                    WHEN invoice_date >= NOW() - INTERVAL '60 days' THEN '31-60 Days'
                    WHEN invoice_date >= NOW() - INTERVAL '90 days' THEN '61-90 Days'
                    ELSE '90+ Days'
                END as range,
                COUNT(*)::int as count,
                COALESCE(SUM(balance_due), 0)::float as amount
            FROM invoice_master
            WHERE payment_status IN ('UNPAID', 'PARTIAL')
                AND invoice_date BETWEEN ${startDate} AND ${endDate}
                ${companyId !== 'all'
                ? Prisma.sql`AND company_id = ${Number(companyId)}`
                : Prisma.empty}
            GROUP BY range
        `.catch((err) => {
                    console.error("Aging Query Error:", err);
                    return [];
                });

        // Monthly Collections
        const monthlyCollections = await prisma.$queryRaw`
            SELECT 
                TO_CHAR(dates.month, 'Mon YY') as month,
                COALESCE(SUM(r.total_amount), 0)::float as collected,
                COALESCE(SUM(i.grand_total_amount), 0)::float as invoiced
            FROM (
                SELECT generate_series(
                    DATE_TRUNC('month', ${startDate}::timestamp),
                    DATE_TRUNC('month', ${endDate}::timestamp),
                    '1 month'::interval
                ) as month
            ) dates
            LEFT JOIN receipt_master r 
                ON DATE_TRUNC('month', r.receipt_date) = dates.month
                AND r.status = 'CLEARED'
            LEFT JOIN invoice_master i 
                ON DATE_TRUNC('month', i.invoice_date) = dates.month
                ${companyId !== 'all'
                ? Prisma.sql`AND i.company_id = ${Number(companyId)}`
                : Prisma.empty}
            GROUP BY dates.month
            ORDER BY dates.month ASC
        `.catch((err) => {
                    console.error("Monthly Query Error:", err);
                    return [];
                });

        // Top Debtors - FIX: Join through order_master
        const topDebtors = await prisma.$queryRaw`
            SELECT 
                c.id, 
                c.customer_name as name, 
                c.customer_code as code,
                COALESCE(SUM(im.balance_due), 0)::float as total_due,
                COUNT(im.id)::int as invoice_count
            FROM customer_master c
            JOIN order_master om ON c.id = om.customer_id
            JOIN invoice_master im ON om.id = im.sale_order_id
            WHERE im.payment_status IN ('UNPAID', 'PARTIAL')
                AND im.invoice_date BETWEEN ${startDate} AND ${endDate}
                ${companyId !== "all"
                ? Prisma.sql`AND im.company_id = ${Number(companyId)}`
                : Prisma.empty}
            GROUP BY c.id, c.customer_name, c.customer_code
            ORDER BY total_due DESC
            LIMIT 10
        `.catch((err) => {
                    console.error("Top Debtors Error:", err);
                    return [];
                });

        // Bank Collections
        const bankCollections = await prisma.$queryRaw`
            SELECT 
                bd.bank_name as bank,
                COALESCE(SUM(rm.total_amount), 0)::float as amount,
                COUNT(rm.id)::int as count
            FROM bank_detail_master bd
            LEFT JOIN receipt_master rm ON bd.id = rm.receiving_bank_id
            WHERE rm.status = 'CLEARED'
                AND rm.receipt_date BETWEEN ${startDate} AND ${endDate}
            GROUP BY bd.id, bd.bank_name
            ORDER BY amount DESC
        `.catch((err) => {
            console.error("Bank Collections Error:", err);
            return [];
        });

        // Recent Receipts - FIX: Use proper relation
        const recentReceipts = await prisma.receiptMaster.findMany({
            take: 10,
            orderBy: { created_at: "desc" },
            where: {
                receipt_date: { gte: startDate, lte: endDate },
                status: "CLEARED",
            },
            include: {
                customer: {
                    select: {
                        customer_name: true,
                        customer_code: true
                    }
                }
            }
        });

        // Aggregate Summary
        const resInvoiced = Number(totalReceivables._sum.balance_due || 0);
        const resReceived = Number(totalReceived._sum.total_amount || 0);
        const resAdvance = Number(advanceBalance._sum.unused_amount || 0);

        return NextResponse.json({
            summary: {
                totalReceivables: resInvoiced,
                totalReceived: resReceived,
                advanceBalance: resAdvance,
                collectionRate: (resReceived / (resInvoiced + resReceived || 1)) * 100,
            },
            paymentStatusDistribution: paymentStatusDist.map((p) => ({
                status: p.payment_status,
                count: Number(p._count.id),
                amount: Number(p._sum.grand_total_amount) || 0,
            })),
            invoiceAging: (invoiceAging || []).map((a: any) => ({
                range: a.range,
                count: Number(a.count),
                amount: Number(a.amount),
            })),
            monthlyCollections: (monthlyCollections || []).map((m: any) => ({
                month: m.month,
                collected: Number(m.collected),
                invoiced: Number(m.invoiced),
            })),
            topDebtors: (topDebtors || []).map((d: any) => ({
                id: d.id,
                name: d.name,
                code: d.code,
                totalDue: Number(d.total_due),
                invoiceCount: Number(d.invoice_count),
            })),
            bankCollections: (bankCollections || []).map((b: any) => ({
                bank: b.bank,
                amount: Number(b.amount),
                count: Number(b.count),
            })),
            paymentModes: (paymentModes || []).map((p: any) => ({
                mode: p.mode,
                subMode: p.sub_mode,
                count: Number(p._count.id),
                amount: Number(p._sum.total_amount) || 0,
            })),
            recentReceipts: (recentReceipts || []).map((r: any) => ({
                id: r.id,
                voucherNo: r.receipt_voucher_no,
                customer: r.customer?.customer_name || "N/A",
                amount: Number(r.total_amount),
                mode: r.mode,
                subMode: r.sub_mode,
                date: r.receipt_date,
                status: r.status,
            })),
        });
    } catch (error) {
        console.error("❌ Financial Dashboard Error:", error);
        return NextResponse.json(
            {
                error: "Failed to load financial data",
                details: error instanceof Error ? error.message : String(error)
            },
            { status: 500 }
        );
    }
}




//
// import { prisma } from "@/lib/prisma";
// import { NextResponse } from "next/server";
// import { Prisma } from "@prisma/client";

// export const dynamic = 'force-dynamic';
// // FIX: Allow JSON.stringify to handle BigInt numbers from Prisma
// (BigInt.prototype as any).toJSON = function () {
//     return Number(this);
// };

// export async function GET(req: Request) {
//     try {
//         const { searchParams } = new URL(req.url);
//         const startDate = new Date(searchParams.get("startDate") || new Date().setDate(new Date().getDate() - 30));
//         const endDate = new Date(searchParams.get("endDate") || new Date());
//         const companyId = searchParams.get("companyId") || "all";

//         const companyFilter = companyId !== "all" ? { company_id: Number(companyId) } : {};

//         // 1. Basic Aggregations (Using Prisma methods is safer than Raw SQL)
//         const [totalReceivables, totalReceived, advanceBalance, paymentStatusDist] = await Promise.all([
//             prisma.invoiceMaster.aggregate({
//                 _sum: { balance_due: true },
//                 where: {
//                     payment_status: { in: ["UNPAID", "PARTIAL"] },
//                     invoice_date: { gte: startDate, lte: endDate },
//                     ...companyFilter,
//                 },
//             }),
//             prisma.receiptMaster.aggregate({
//                 _sum: { total_amount: true },
//                 where: {
//                     status: "CLEARED",
//                     receipt_date: { gte: startDate, lte: endDate },
//                     ...(companyId !== "all" && { customer: { company_id: Number(companyId) } }),
//                 },
//             }),
//             prisma.receiptMaster.aggregate({
//                 _sum: { unused_amount: true },
//                 where: { unused_amount: { gt: 0 } },
//             }),
//             prisma.invoiceMaster.groupBy({
//                 by: ["payment_status"],
//                 _count: { id: true },
//                 _sum: { grand_total_amount: true },
//                 where: {
//                     ...companyFilter,
//                     invoice_date: { gte: startDate, lte: endDate },
//                 },
//             })
//         ]);

//         // 2. Fixed Raw SQL for Aging (Postgres specific)
//         const invoiceAging: any[] = await prisma.$queryRaw`
//             SELECT
//                 CASE
//                     WHEN invoice_date >= NOW() - INTERVAL '30 days' THEN '0-30 Days'
//                     WHEN invoice_date >= NOW() - INTERVAL '60 days' THEN '31-60 Days'
//                     WHEN invoice_date >= NOW() - INTERVAL '90 days' THEN '61-90 Days'
//                     ELSE '90+ Days'
//                 END as range,
//                 COUNT(*)::int as count,
//                 COALESCE(SUM(balance_due), 0)::float as amount
//             FROM invoice_master
//             WHERE payment_status IN ('UNPAID', 'PARTIAL')
//                 AND invoice_date BETWEEN ${startDate} AND ${endDate}
//                 ${companyId !== "all" ? Prisma.sql`AND company_id = ${Number(companyId)}` : Prisma.empty}
//             GROUP BY range
//         `.catch(() => []);

//         // 3. Fixed Raw SQL for Monthly Trends
//         const monthlyCollections: any[] = await prisma.$queryRaw`
//             SELECT
//                 TO_CHAR(dates.month, 'Mon YY') as month,
//                 COALESCE(SUM(r.total_amount), 0)::float as collected,
//                 COALESCE(SUM(i.grand_total_amount), 0)::float as invoiced
//             FROM (
//                 SELECT generate_series(
//                     DATE_TRUNC('month', ${startDate}::timestamp),
//                     DATE_TRUNC('month', ${endDate}::timestamp),
//                     '1 month'::interval
//                 ) as month
//             ) dates
//             LEFT JOIN receipt_master r ON DATE_TRUNC('month', r.receipt_date) = dates.month AND r.status = 'CLEARED'
//             LEFT JOIN invoice_master i ON DATE_TRUNC('month', i.invoice_date) = dates.month
//             GROUP BY dates.month
//             ORDER BY dates.month ASC
//         `.catch(() => []);

//         // 4. Recent Receipts (Using Prisma FindMany to avoid table name errors)
//         const recentReceipts = await prisma.receiptMaster.findMany({
//             take: 10,
//             orderBy: { created_at: "desc" },
//             where: {
//                 receipt_date: { gte: startDate, lte: endDate },
//                 status: "CLEARED",
//                 ...(companyId !== "all" && { customer: { company_id: Number(companyId) } }),
//             },
//             include: { customer: true }
//         });

//         // Format Response
//         const resInvoiced = Number(totalReceivables._sum.balance_due || 0);
//         const resReceived = Number(totalReceived._sum.total_amount || 0);

//         return NextResponse.json({
//             summary: {
//                 totalReceivables: resInvoiced,
//                 totalReceived: resReceived,
//                 advanceBalance: Number(advanceBalance._sum.unused_amount || 0),
//                 collectionRate: (resReceived / (resInvoiced + resReceived || 1)) * 100,
//             },
//             paymentStatusDistribution: paymentStatusDist.map(p => ({
//                 status: p.payment_status,
//                 count: Number(p._count.id),
//                 amount: Number(p._sum.grand_total_amount || 0),
//             })),
//             invoiceAging,
//             monthlyCollections,
//             topDebtors: [], // Temporary empty array to prevent crashes
//             bankCollections: [], // Temporary empty array
//             recentReceipts: recentReceipts.map(r => ({
//                 voucherNo: r.receipt_voucher_no,
//                 customer: r.customer?.customer_name || "Unknown",
//                 amount: Number(r.total_amount),
//                 mode: r.mode,
//                 subMode: r.sub_mode,
//                 date: r.receipt_date,
//                 status: r.status,
//             })),
//             paymentModes: [] // Temporary empty array
//         });

//     } catch (error) {
//         console.error("❌ API ERROR:", error);
//         return NextResponse.json({ error: "Database query failed" }, { status: 500 });
//     }
// }