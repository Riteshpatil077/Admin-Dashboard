import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function test() {
  try {
    const res = await prisma.$queryRaw`
            SELECT 
                c.category_name as category,
                COALESCE(SUM(id.taxable_amount), 0)::float as revenue
            FROM order_item_detail id
            JOIN order_master o ON id.order_id = o.id
            JOIN product_master p ON id.product_id = p.id
            JOIN product_category_master c ON p.product_category_id = c.id
            WHERE o.status != 'CANCELLED'
            GROUP BY c.category_name
            ORDER BY revenue DESC
        `;
    console.log("TEST SUCCESS:", res);
  } catch (e: any) {
    console.error("TEST FAILED:", e.message);
  } finally {
    await prisma.$disconnect();
  }
}
test();
