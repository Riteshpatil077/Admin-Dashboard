// @ts-nocheck
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        // Revenue by Product Category
        const revenueByCategory = await prisma.$queryRaw<
            { category: string; revenue: number; orders: bigint }[]
        >`
      SELECT 
        pc.product_category_name as category,
        COALESCE(SUM(oid.taxable_amount), 0) as revenue,
        COUNT(DISTINCT o.id) as orders
      FROM product_category_master pc
      LEFT JOIN product_master p ON pc.id = p.product_category_id
      LEFT JOIN order_item_detail oid ON p.id = oid.product_id
      LEFT JOIN order_master o ON oid.order_id = o.id
      WHERE pc.status = 'ACTIVE'
      GROUP BY pc.id, pc.product_category_name
      ORDER BY revenue DESC
      LIMIT 10
    `;

        // Customer by Category
        const customersByCategory = await prisma.$queryRaw<
            { category: string; count: bigint; revenue: number }[]
        >`
      SELECT 
        cc.category_name as category,
        COUNT(c.id) as count,
        COALESCE(SUM(im.grand_total_amount), 0) as revenue
      FROM customer_category_master cc
      LEFT JOIN customer_master c ON cc.id = c.category_id
      LEFT JOIN invoice_master im ON c.id = im.customer_id
      WHERE cc.status = 'ACTIVE'
      GROUP BY cc.id, cc.category_name
      ORDER BY count DESC
    `;

        // Top Products
        const topProducts = await prisma.$queryRaw<
            {
                id: number;
                name: string;
                category: string;
                quantity: bigint;
                revenue: number;
            }[]
        >`
      SELECT 
        p.id,
        p.product_name as name,
        pc.product_category_name as category,
        COALESCE(SUM(oid.quantity), 0) as quantity,
        COALESCE(SUM(oid.taxable_amount), 0) as revenue
      FROM product_master p
      LEFT JOIN product_category_master pc ON p.product_category_id = pc.id
      LEFT JOIN order_item_detail oid ON p.id = oid.product_id
      WHERE p.status = 'ACTIVE'
      GROUP BY p.id, p.product_name, pc.product_category_name
      ORDER BY revenue DESC
      LIMIT 10
    `;

        // Subscription Analytics
        const subscriptionAnalytics = await prisma.$queryRaw<
            { period: string; count: bigint; revenue: number }[]
        >`
      SELECT 
        CONCAT(sp.period_value, ' ', sp.period_type) as period,
        COUNT(sm.id) as count,
        COALESCE(SUM(sm.grand_total_amount), 0) as revenue
      FROM subscription_period_master sp
      LEFT JOIN subscription_master sm ON sp.id = sm.subscription_period_id
      WHERE sp.status = 'ACTIVE'
      GROUP BY sp.id, sp.period_value, sp.period_type
      ORDER BY count DESC
    `;

        // State-wise Orders
        const stateWiseOrders = await prisma.$queryRaw<
            { state: string; orders: bigint; revenue: number }[]
        >`
      SELECT 
        s.state_name as state,
        COUNT(o.id) as orders,
        COALESCE(SUM(o.grand_total_amount), 0) as revenue
      FROM state_master s
      LEFT JOIN customer_master c ON s.id = c.state_id
      LEFT JOIN order_master o ON c.id = o.customer_id
      GROUP BY s.id, s.state_name
      HAVING COUNT(o.id) > 0
      ORDER BY orders DESC
      LIMIT 10
    `;

        // Monthly Comparison (Current vs Previous Year)
        const monthlyComparison = await prisma.$queryRaw<
            { month: string; current_year: number; previous_year: number }[]
        >`
      SELECT 
        TO_CHAR(order_date, 'Mon') as month,
        COALESCE(SUM(CASE WHEN EXTRACT(YEAR FROM order_date) = EXTRACT(YEAR FROM NOW()) 
          THEN grand_total_amount ELSE 0 END), 0) as current_year,
        COALESCE(SUM(CASE WHEN EXTRACT(YEAR FROM order_date) = EXTRACT(YEAR FROM NOW()) - 1 
          THEN grand_total_amount ELSE 0 END), 0) as previous_year
      FROM order_master
      WHERE order_date >= NOW() - INTERVAL '2 years'
      GROUP BY TO_CHAR(order_date, 'Mon'), EXTRACT(MONTH FROM order_date)
      ORDER BY EXTRACT(MONTH FROM order_date)
    `;

        // GST Summary
        const gstSummary = await prisma.$queryRaw<
            { cgst: number; sgst: number; igst: number }[]
        >`
      SELECT 
        COALESCE(SUM(cgst_amount), 0) as cgst,
        COALESCE(SUM(sgst_amount), 0) as sgst,
        COALESCE(SUM(igst_amount), 0) as igst
      FROM order_item_detail
    `;

        return NextResponse.json({
            revenueByCategory: revenueByCategory.map((r) => ({
                category: r.category,
                revenue: Number(r.revenue),
                orders: Number(r.orders),
            })),
            customersByCategory: customersByCategory.map((c) => ({
                category: c.category,
                count: Number(c.count),
                revenue: Number(c.revenue),
            })),
            topProducts: topProducts.map((p) => ({
                id: p.id,
                name: p.name,
                category: p.category,
                quantity: Number(p.quantity),
                revenue: Number(p.revenue),
            })),
            subscriptionAnalytics: subscriptionAnalytics.map((s) => ({
                period: s.period,
                count: Number(s.count),
                revenue: Number(s.revenue),
            })),
            stateWiseOrders: stateWiseOrders.map((s) => ({
                state: s.state,
                orders: Number(s.orders),
                revenue: Number(s.revenue),
            })),
            monthlyComparison: monthlyComparison.map((m) => ({
                month: m.month,
                currentYear: Number(m.current_year),
                previousYear: Number(m.previous_year),
            })),
            gstSummary: {
                cgst: Number(gstSummary[0]?.cgst || 0),
                sgst: Number(gstSummary[0]?.sgst || 0),
                igst: Number(gstSummary[0]?.igst || 0),
                total:
                    Number(gstSummary[0]?.cgst || 0) +
                    Number(gstSummary[0]?.sgst || 0) +
                    Number(gstSummary[0]?.igst || 0),
            },
        });
    } catch (error) {
        console.error("Analytics Error:", error);
        return NextResponse.json(
            { error: "Failed to load analytics" },
            { status: 500 }
        );
    }
}