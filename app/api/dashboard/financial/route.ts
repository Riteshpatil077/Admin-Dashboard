// @ts-nocheck
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

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
                ...companyFilter,
                payment_status: { in: ["UNPAID", "PARTIAL"] },
                invoice_date: { gte: startDate, lte: endDate },
            },
        });

        // Total Received (Receipts in range)
        const totalReceived = await prisma.receiptMaster.aggregate({
            _sum: { total_amount: true },
            where: {
                status: "CLEARED",
                receipt_date: { gte: startDate, lte: endDate },
                // If receipts are company-scoped via invoice linkage (recommended), filter via invoice relationship:
                // customer: { some: { InvoiceMaster: { some: { ...companyFilter } } } }, // if modeled that way
            },
        });

        // Advance Balance (Unused)
        const advanceBalance = await prisma.receiptMaster.aggregate({
            _sum: { unused_amount: true },
            where: {
                unused_amount: { gt: 0 },
                // Optional date window for advance analysis if policy requires
            },
        });

        const paymentStatusDist = await prisma.invoiceMaster.groupBy({
            by: ["payment_status"],
            _count: { id: true },
            _sum: { grand_total_amount: true },
            where: {
                ...companyFilter,
                invoice_date: { gte: startDate, lte: endDate },
            },
        });

        const invoiceAging = await prisma.$queryRaw<
            { range: string; count: bigint; amount: number }[]
        >`
      SELECT 
        CASE 
          WHEN invoice_date >= NOW() - INTERVAL '30 days' THEN '0-30 Days'
          WHEN invoice_date >= NOW() - INTERVAL '60 days' THEN '31-60 Days'
          WHEN invoice_date >= NOW() - INTERVAL '90 days' THEN '61-90 Days'
          ELSE '90+ Days'
        END as range,
        COUNT(*) as count,
        COALESCE(SUM(balance_due), 0) as amount
      FROM invoice_master
      WHERE payment_status IN ('UNPAID', 'PARTIAL')
        AND invoice_date BETWEEN ${startDate} AND ${endDate}
        ${companyId !== "all" ? `AND company_id = ${Number(companyId)}` : ""}
      GROUP BY range
      ORDER BY 
        CASE range WHEN '0-30 Days' THEN 1 WHEN '31-60 Days' THEN 2 WHEN '61-90 Days' THEN 3 ELSE 4 END
    `;

        // Monthly collections + invoicing side-by-side
        const monthlyCollections = await prisma.$queryRaw<
            { month: string; collected: number; invoiced: number }[]
        >`
      SELECT 
        TO_CHAR(dates.month, 'Mon YY') as month,
        COALESCE(SUM(r.total_amount), 0) as collected,
        COALESCE(SUM(i.grand_total_amount), 0) as invoiced
      FROM (
        SELECT generate_series(
          DATE_TRUNC('month', ${startDate}),
          DATE_TRUNC('month', ${endDate}),
          '1 month'::interval
        ) as month
      ) dates
      LEFT JOIN receipt_master r 
        ON DATE_TRUNC('month', r.receipt_date) = dates.month
        ${companyId !== "all" ? `AND r.customer_id IN (SELECT id FROM customer_master WHERE company_id = ${Number(companyId)})` : ""}
      LEFT JOIN invoice_master i 
        ON DATE_TRUNC('month', i.invoice_date) = dates.month
        ${companyId !== "all" ? `AND i.company_id = ${Number(companyId)}` : ""}
      GROUP BY dates.month
      ORDER BY dates.month
    `;

        const topDebtors = await prisma.$queryRaw<
            { id: number; name: string; code: string; total_due: number; invoice_count: bigint }[]
        >`
      SELECT 
        c.id, c.customer_name as name, c.customer_code as code,
        COALESCE(SUM(im.balance_due), 0) as total_due,
        COUNT(im.id) as invoice_count
      FROM customer_master c
      JOIN invoice_master im ON c.id = im.customer_id
      WHERE im.payment_status IN ('UNPAID', 'PARTIAL')
        AND im.invoice_date BETWEEN ${startDate} AND ${endDate}
        ${companyId !== "all" ? `AND im.company_id = ${Number(companyId)}` : ""}
      GROUP BY c.id, c.customer_name, c.customer_code
      ORDER BY total_due DESC
      LIMIT 10
    `;

        const bankCollections = await prisma.$queryRaw<
            { bank: string; amount: number; count: bigint }[]
        >`
      SELECT 
        bd.bank_name as bank,
        COALESCE(SUM(rm.total_amount), 0) as amount,
        COUNT(rm.id) as count
      FROM bank_detail_master bd
      LEFT JOIN receipt_master rm ON bd.id = rm.receiving_bank_id
      WHERE rm.status = 'CLEARED'
        AND rm.receipt_date BETWEEN ${startDate} AND ${endDate}
        ${companyId !== "all" ? `AND rm.customer_id IN (SELECT id FROM customer_master WHERE company_id = ${Number(companyId)})` : ""}
      GROUP BY bd.id, bd.bank_name
      ORDER BY amount DESC
    `;

        const paymentModes = await prisma.receiptMaster.groupBy({
            by: ["mode", "sub_mode"],
            _count: { id: true },
            _sum: { total_amount: true },
            where: {
                receipt_date: { gte: startDate, lte: endDate },
                status: "CLEARED",
                ...(companyId !== "all" && {
                    customer: { companyId: Number(companyId) },
                }),
            },
        });

        const recentReceipts = await prisma.receiptMaster.findMany({
            take: 10,
            orderBy: { created_at: "desc" },
            where: {
                receipt_date: { gte: startDate, lte: endDate },
                status: "CLEARED",
                ...(companyId !== "all" && {
                    customer: { companyId: Number(companyId) },
                }),
            },
            include: {
                customer: {
                    select: { customer_name: true, customer_code: true }
                }
            }
        });

        return NextResponse.json({
            totalReceivables: Number(totalReceivables._sum.balance_due) || 0,
            totalReceived: Number(totalReceived._sum.total_amount) || 0,
            advanceBalance: Number(advanceBalance._sum.unused_amount) || 0,
            collectionRate:
                ((Number(totalReceived._sum.total_amount) || 0) /
                    (((Number(totalReceivables._sum.balance_due) || 0) +
                        (Number(totalReceived._sum.total_amount) || 0)) || 1)) *
                100, // Handle divide by zero
            paymentStatusDistribution: paymentStatusDist.map((p) => ({
                status: p.payment_status,
                count: p._count.id,
                amount: Number(p._sum.grand_total_amount) || 0,
            })),
            invoiceAging: invoiceAging.map((a) => ({
                range: a.range,
                count: Number(a.count),
                amount: Number(a.amount),
            })),
            monthlyCollections: monthlyCollections.map((m) => ({
                month: m.month,
                collected: Number(m.collected),
                invoiced: Number(m.invoiced),
            })),
            topDebtors: topDebtors.map((d) => ({
                id: d.id,
                name: d.name,
                code: d.code,
                totalDue: Number(d.total_due),
                invoiceCount: Number(d.invoice_count),
            })),
            bankCollections: bankCollections.map((b) => ({
                bank: b.bank,
                amount: Number(b.amount),
                count: Number(b.count),
            })),
            paymentModes: paymentModes.map((p) => ({
                mode: p.mode,
                subMode: p.sub_mode,
                count: p._count.id,
                amount: Number(p._sum.total_amount) || 0,
            })),
            recentReceipts: recentReceipts.map((r) => ({
                id: r.id,
                voucherNo: r.receipt_voucher_no,
                customer: r.customer.customer_name,
                amount: Number(r.total_amount),
                mode: r.mode,
                subMode: r.sub_mode,
                date: r.receipt_date,
                status: r.status,
            })),
        });
    } catch (error) {
        console.error("Financial Dashboard Error:", error);
        return NextResponse.json(
            { error: "Failed to load financial data" },
            { status: 500 }
        );
    }
}