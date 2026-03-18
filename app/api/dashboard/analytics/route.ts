// @ts-nocheck
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// ✅ FIX 1: Add BigInt serialization
(BigInt.prototype as any).toJSON = function () {
  return Number(this);
};

export async function GET() {
  try {
    // Run all queries with catch fallbacks
    const [
      revenueByCategory,
      customersByCategory,
      topProducts,
      subscriptionAnalytics,
      stateWiseOrders,
      monthlyComparison,
      gstSummaryRaw
    ] = await Promise.all([
      // ✅ FIX 2: Cast BigInt to int/float
      prisma.$queryRaw`
                SELECT 
                    pc.product_category_name as category, 
                    COALESCE(SUM(oid.taxable_amount), 0)::float as revenue, 
                    COUNT(DISTINCT o.id)::int as orders
                FROM product_category_master pc
                LEFT JOIN product_master p ON pc.id = p.product_category_id
                LEFT JOIN order_item_detail oid ON p.id = oid.product_id
                LEFT JOIN order_master o ON oid.order_id = o.id
                WHERE pc.status = 'ACTIVE' 
                GROUP BY pc.id, pc.product_category_name 
                ORDER BY revenue DESC 
                LIMIT 10
            `.catch((err) => {
        console.error("❌ Revenue by Category Error:", err);
        return [];
      }),

      // ✅ FIX 3: Correct customer-invoice relationship
      prisma.$queryRaw`
                SELECT 
                    cc.category_name as category, 
                    COUNT(DISTINCT c.id)::int as count, 
                    COALESCE(SUM(im.grand_total_amount), 0)::float as revenue
                FROM customer_category_master cc
                LEFT JOIN customer_master c ON cc.id = c.category_id
                LEFT JOIN order_master o ON c.id = o.customer_id
                LEFT JOIN invoice_master im ON o.id = im.sale_order_id
                WHERE cc.status = 'ACTIVE' 
                GROUP BY cc.id, cc.category_name 
                ORDER BY count DESC
            `.catch((err) => {
        console.error("❌ Customers by Category Error:", err);
        return [];
      }),

      prisma.$queryRaw`
                SELECT 
                    p.id, 
                    p.product_name as name, 
                    pc.product_category_name as category, 
                    COALESCE(SUM(oid.quantity), 0)::int as quantity, 
                    COALESCE(SUM(oid.taxable_amount), 0)::float as revenue
                FROM product_master p
                LEFT JOIN product_category_master pc ON p.product_category_id = pc.id
                LEFT JOIN order_item_detail oid ON p.id = oid.product_id
                WHERE p.status = 'ACTIVE' 
                GROUP BY p.id, p.product_name, pc.product_category_name 
                ORDER BY revenue DESC 
                LIMIT 10
            `.catch((err) => {
        console.error("❌ Top Products Error:", err);
        return [];
      }),

      prisma.$queryRaw`
                SELECT 
                    CONCAT(sp.period_value, ' ', sp.period_type) as period, 
                    COUNT(sm.id)::int as count, 
                    COALESCE(SUM(sm.grand_total_amount), 0)::float as revenue
                FROM subscription_period_master sp
                LEFT JOIN subscription_master sm ON sp.id = sm.subscription_period_id
                WHERE sp.status = 'ACTIVE' 
                GROUP BY sp.id, sp.period_value, sp.period_type 
                ORDER BY count DESC
            `.catch((err) => {
        console.error("❌ Subscription Analytics Error:", err);
        return [];
      }),

      prisma.$queryRaw`
                SELECT 
                    s.state_name as state, 
                    COUNT(o.id)::int as orders, 
                    COALESCE(SUM(o.grand_total_amount), 0)::float as revenue
                FROM state_master s
                LEFT JOIN customer_master c ON s.id = c.state_id
                LEFT JOIN order_master o ON c.id = o.customer_id
                GROUP BY s.id, s.state_name 
                HAVING COUNT(o.id) > 0 
                ORDER BY orders DESC 
                LIMIT 10
            `.catch((err) => {
        console.error("❌ State-wise Orders Error:", err);
        return [];
      }),

      prisma.$queryRaw`
                SELECT 
                    TO_CHAR(order_date, 'Mon') as month,
                    COALESCE(SUM(CASE WHEN EXTRACT(YEAR FROM order_date) = EXTRACT(YEAR FROM NOW()) 
                        THEN grand_total_amount ELSE 0 END), 0)::float as current_year,
                    COALESCE(SUM(CASE WHEN EXTRACT(YEAR FROM order_date) = EXTRACT(YEAR FROM NOW()) - 1 
                        THEN grand_total_amount ELSE 0 END), 0)::float as previous_year
                FROM order_master 
                WHERE order_date >= NOW() - INTERVAL '2 years'
                GROUP BY TO_CHAR(order_date, 'Mon'), EXTRACT(MONTH FROM order_date) 
                ORDER BY EXTRACT(MONTH FROM order_date)
            `.catch((err) => {
        console.error("❌ Monthly Comparison Error:", err);
        return [];
      }),

      prisma.$queryRaw`
                SELECT 
                    COALESCE(SUM(cgst_amount), 0)::float as cgst, 
                    COALESCE(SUM(sgst_amount), 0)::float as sgst, 
                    COALESCE(SUM(igst_amount), 0)::float as igst
                FROM order_item_detail
            `.catch((err) => {
        console.error("❌ GST Summary Error:", err);
        return [{ cgst: 0, sgst: 0, igst: 0 }];
      })
    ]);

    const cgst = Number(gstSummaryRaw[0]?.cgst || 0);
    const sgst = Number(gstSummaryRaw[0]?.sgst || 0);
    const igst = Number(gstSummaryRaw[0]?.igst || 0);

    return NextResponse.json({
      revenueByCategory: (revenueByCategory || []).map((r) => ({
        category: r.category,
        revenue: Number(r.revenue || 0),
        orders: Number(r.orders || 0),
      })),
      customersByCategory: (customersByCategory || []).map((c) => ({
        category: c.category,
        count: Number(c.count || 0),
        revenue: Number(c.revenue || 0),
      })),
      topProducts: (topProducts || []).map((p) => ({
        id: p.id,
        name: p.name,
        category: p.category || 'Uncategorized',
        quantity: Number(p.quantity || 0),
        revenue: Number(p.revenue || 0),
      })),
      subscriptionAnalytics: (subscriptionAnalytics || []).map((s) => ({
        period: s.period,
        count: Number(s.count || 0),
        revenue: Number(s.revenue || 0),
      })),
      stateWiseOrders: (stateWiseOrders || []).map((s) => ({
        state: s.state,
        orders: Number(s.orders || 0),
        revenue: Number(s.revenue || 0),
      })),
      monthlyComparison: (monthlyComparison || []).map((m) => ({
        month: m.month,
        currentYear: Number(m.current_year || 0),
        previousYear: Number(m.previous_year || 0),
      })),
      gstSummary: {
        cgst,
        sgst,
        igst,
        total: cgst + sgst + igst,
      },
    });
  } catch (error) {
    console.error("❌ Analytics API Error:", error);
    // Return expected structure with empty data
    return NextResponse.json({
      error: "Failed to load analytics data",
      details: error instanceof Error ? error.message : String(error),
      revenueByCategory: [],
      customersByCategory: [],
      topProducts: [],
      subscriptionAnalytics: [],
      stateWiseOrders: [],
      monthlyComparison: [],
      gstSummary: { cgst: 0, sgst: 0, igst: 0, total: 0 }
    }, { status: 500 });
  }
}