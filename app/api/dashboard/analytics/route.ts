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
    const [
      revenueByCategory,
      customersByCategory,
      topProducts,
      subscriptionAnalytics,
      stateWiseOrders,
      monthlyComparison,
      gstSummaryRaw,
      subscriptionByStatus,
      topSubscriptionProducts,
    ] = await Promise.all([

      // ✅ 1. Revenue by Product Category
      prisma.$queryRaw`
                SELECT 
                    pc.product_category_name AS category,
                    COALESCE(SUM(oid.taxable_amount), 0)::float AS revenue,
                    COUNT(DISTINCT o.id)::int AS orders
                FROM product_category_master pc
                LEFT JOIN product_master p 
                    ON pc.id = p.product_category_id 
                    AND p.status = 'ACTIVE'
                LEFT JOIN order_item_detail oid 
                    ON p.id = oid.product_id
                LEFT JOIN order_master o 
                    ON oid.order_id = o.id
                WHERE pc.status = 'ACTIVE'
                GROUP BY pc.id, pc.product_category_name
                ORDER BY revenue DESC
                LIMIT 10
            `.catch((err) => {
        console.error("❌ Revenue by Category Error:", err.message);
        return [];
      }),

      // ✅ 2. Customers by Category
      // FIX: customer_category_master has NO status field in schema
      // FIX: invoice joins through order_master -> invoice_master
      prisma.$queryRaw`
                SELECT 
                    cc.category_name AS category,
                    COUNT(DISTINCT c.id)::int AS count,
                    COALESCE(SUM(im.grand_total_amount), 0)::float AS revenue
                FROM customer_category_master cc
                LEFT JOIN customer_master c 
                    ON cc.id = c.category_id
                    AND c.status = 'ACTIVE'
                LEFT JOIN order_master o 
                    ON c.id = o.customer_id
                LEFT JOIN invoice_master im 
                    ON o.id = im.sale_order_id
                GROUP BY cc.id, cc.category_name
                ORDER BY count DESC
            `.catch((err) => {
        console.error("❌ Customers by Category Error:", err.message);
        return [];
      }),

      // ✅ 3. Top Products by Revenue
      prisma.$queryRaw`
                SELECT 
                    p.id,
                    p.product_name AS name,
                    p.product_code AS code,
                    COALESCE(pc.product_category_name, 'Uncategorized') AS category,
                    COALESCE(SUM(oid.quantity), 0)::int AS quantity,
                    COALESCE(SUM(oid.taxable_amount), 0)::float AS revenue,
                    COUNT(DISTINCT o.id)::int AS order_count
                FROM product_master p
                LEFT JOIN product_category_master pc 
                    ON p.product_category_id = pc.id
                LEFT JOIN order_item_detail oid 
                    ON p.id = oid.product_id
                LEFT JOIN order_master o 
                    ON oid.order_id = o.id
                WHERE p.status = 'ACTIVE'
                GROUP BY p.id, p.product_name, p.product_code, pc.product_category_name
                ORDER BY revenue DESC
                LIMIT 10
            `.catch((err) => {
        console.error("❌ Top Products Error:", err.message);
        return [];
      }),

      // ✅ 4. Subscription Analytics by Period
      // FIX: subscription_master uses grand_total_amount not revenue
      prisma.$queryRaw`
                SELECT 
                    CONCAT(sp.period_value::text, ' ', sp.period_type) AS period,
                    sp.period_value,
                    sp.period_type,
                    COUNT(sm.id)::int AS count,
                    COALESCE(SUM(sm.grand_total_amount), 0)::float AS revenue,
                    COUNT(CASE WHEN sm.validity_status = 'VALID' THEN 1 END)::int AS active_count,
                    COUNT(CASE WHEN sm.validity_status = 'EXPIRED' THEN 1 END)::int AS expired_count
                FROM subscription_period_master sp
                LEFT JOIN subscription_master sm 
                    ON sp.id = sm.subscription_period_id
                WHERE sp.status = 'ACTIVE'
                GROUP BY sp.id, sp.period_value, sp.period_type
                ORDER BY count DESC
            `.catch((err) => {
        console.error("❌ Subscription Analytics Error:", err.message);
        return [];
      }),

      // ✅ 5. State-wise Orders
      prisma.$queryRaw`
                SELECT 
                    s.state_name AS state,
                    s.state_code AS code,
                    COUNT(DISTINCT o.id)::int AS orders,
                    COALESCE(SUM(o.grand_total_amount), 0)::float AS revenue,
                    COUNT(DISTINCT c.id)::int AS customers
                FROM state_master s
                INNER JOIN customer_master c 
                    ON s.id = c.state_id
                INNER JOIN order_master o 
                    ON c.id = o.customer_id
                GROUP BY s.id, s.state_name, s.state_code
                HAVING COUNT(DISTINCT o.id) > 0
                ORDER BY orders DESC
                LIMIT 10
            `.catch((err) => {
        console.error("❌ State-wise Orders Error:", err.message);
        return [];
      }),

      // ✅ 6. Monthly Comparison - Current vs Previous Year
      prisma.$queryRaw`
                SELECT 
                    TO_CHAR(order_date, 'Mon') AS month,
                    EXTRACT(MONTH FROM order_date)::int AS month_num,
                    COALESCE(SUM(
                        CASE WHEN EXTRACT(YEAR FROM order_date) = EXTRACT(YEAR FROM NOW()) 
                        THEN grand_total_amount ELSE 0 END
                    ), 0)::float AS current_year,
                    COALESCE(SUM(
                        CASE WHEN EXTRACT(YEAR FROM order_date) = EXTRACT(YEAR FROM NOW()) - 1 
                        THEN grand_total_amount ELSE 0 END
                    ), 0)::float AS previous_year,
                    COUNT(
                        CASE WHEN EXTRACT(YEAR FROM order_date) = EXTRACT(YEAR FROM NOW()) 
                        THEN 1 END
                    )::int AS current_year_orders
                FROM order_master
                WHERE order_date >= NOW() - INTERVAL '2 years'
                GROUP BY TO_CHAR(order_date, 'Mon'), EXTRACT(MONTH FROM order_date)
                ORDER BY EXTRACT(MONTH FROM order_date)
            `.catch((err) => {
        console.error("❌ Monthly Comparison Error:", err.message);
        return [];
      }),

      // ✅ 7. GST Summary from order_item_detail
      prisma.$queryRaw`
                SELECT 
                    COALESCE(SUM(cgst_amount), 0)::float AS cgst,
                    COALESCE(SUM(sgst_amount), 0)::float AS sgst,
                    COALESCE(SUM(igst_amount), 0)::float AS igst,
                    COALESCE(SUM(total_tax_amount), 0)::float AS total_tax,
                    COALESCE(SUM(taxable_amount), 0)::float AS taxable_amount,
                    COALESCE(SUM(discount_amount), 0)::float AS total_discount
                FROM order_item_detail
            `.catch((err) => {
        console.error("❌ GST Summary Error:", err.message);
        return [{ cgst: 0, sgst: 0, igst: 0, total_tax: 0, taxable_amount: 0, total_discount: 0 }];
      }),

      // ✅ 8. Subscription by Status (Bonus)
      prisma.$queryRaw`
                SELECT 
                    validity_status AS status,
                    COUNT(id)::int AS count,
                    COALESCE(SUM(grand_total_amount), 0)::float AS revenue
                FROM subscription_master
                GROUP BY validity_status
                ORDER BY count DESC
            `.catch((err) => {
        console.error("❌ Subscription Status Error:", err.message);
        return [];
      }),

      // ✅ 9. Top Subscription Products (Bonus)
      prisma.$queryRaw`
                SELECT 
                    p.product_name AS name,
                    p.product_code AS code,
                    COUNT(sid.id)::int AS subscription_count,
                    COALESCE(SUM(sid.quantity), 0)::int AS total_quantity,
                    COALESCE(SUM(sid.taxable_amount), 0)::float AS revenue
                FROM subscription_item_detail sid
                JOIN product_master p ON sid.product_id = p.id
                GROUP BY p.id, p.product_name, p.product_code
                ORDER BY subscription_count DESC
                LIMIT 10
            `.catch((err) => {
        console.error("❌ Top Subscription Products Error:", err.message);
        return [];
      }),
    ]);

    // ✅ Safe GST extraction
    const gstRow = gstSummaryRaw?.[0] || {};
    const cgst = Number(gstRow.cgst || 0);
    const sgst = Number(gstRow.sgst || 0);
    const igst = Number(gstRow.igst || 0);
    const totalTax = Number(gstRow.total_tax || 0);
    const taxableAmount = Number(gstRow.taxable_amount || 0);
    const totalDiscount = Number(gstRow.total_discount || 0);

    return NextResponse.json({
      revenueByCategory: (revenueByCategory || []).map((r: any) => ({
        category: r.category || 'Unknown',
        revenue: Number(r.revenue || 0),
        orders: Number(r.orders || 0),
      })),

      customersByCategory: (customersByCategory || []).map((c: any) => ({
        category: c.category || 'Unknown',
        count: Number(c.count || 0),
        revenue: Number(c.revenue || 0),
      })),

      topProducts: (topProducts || []).map((p: any) => ({
        id: Number(p.id),
        name: p.name || 'Unknown',
        code: p.code || '',
        category: p.category || 'Uncategorized',
        quantity: Number(p.quantity || 0),
        revenue: Number(p.revenue || 0),
        orderCount: Number(p.order_count || 0),
      })),

      subscriptionAnalytics: (subscriptionAnalytics || []).map((s: any) => ({
        period: s.period || 'Unknown',
        periodValue: Number(s.period_value || 0),
        periodType: s.period_type || '',
        count: Number(s.count || 0),
        revenue: Number(s.revenue || 0),
        activeCount: Number(s.active_count || 0),
        expiredCount: Number(s.expired_count || 0),
      })),

      stateWiseOrders: (stateWiseOrders || []).map((s: any) => ({
        state: s.state || 'Unknown',
        code: s.code || '',
        orders: Number(s.orders || 0),
        revenue: Number(s.revenue || 0),
        customers: Number(s.customers || 0),
      })),

      monthlyComparison: (monthlyComparison || []).map((m: any) => ({
        month: m.month || '',
        monthNum: Number(m.month_num || 0),
        currentYear: Number(m.current_year || 0),
        previousYear: Number(m.previous_year || 0),
        currentYearOrders: Number(m.current_year_orders || 0),
      })),

      gstSummary: {
        cgst,
        sgst,
        igst,
        total: cgst + sgst + igst,
        totalTax,
        taxableAmount,
        totalDiscount,
      },

      subscriptionByStatus: (subscriptionByStatus || []).map((s: any) => ({
        status: s.status || 'Unknown',
        count: Number(s.count || 0),
        revenue: Number(s.revenue || 0),
      })),

      topSubscriptionProducts: (topSubscriptionProducts || []).map((p: any) => ({
        name: p.name || 'Unknown',
        code: p.code || '',
        subscriptionCount: Number(p.subscription_count || 0),
        totalQuantity: Number(p.total_quantity || 0),
        revenue: Number(p.revenue || 0),
      })),
    });

  } catch (error) {
    console.error("❌ Analytics API Error:", error);
    return NextResponse.json(
      {
        error: "Failed to load analytics data",
        details: error instanceof Error ? error.message : String(error),
        revenueByCategory: [],
        customersByCategory: [],
        topProducts: [],
        subscriptionAnalytics: [],
        stateWiseOrders: [],
        monthlyComparison: [],
        gstSummary: { cgst: 0, sgst: 0, igst: 0, total: 0 },
        subscriptionByStatus: [],
        topSubscriptionProducts: [],
      },
      { status: 500 }
    );
  }
}