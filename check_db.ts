import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
    try {
        const counts = {
            companyMaster: await prisma.companyMaster.count(),
            customerMaster: await prisma.customerMaster.count(),
            invoiceMaster: await prisma.invoiceMaster.count(),
            orderMaster: await prisma.orderMaster.count(),
            receiptMaster: await prisma.receiptMaster.count(),
        };
        console.log("Database Row Counts:", JSON.stringify(counts, null, 2));

        if (counts.invoiceMaster > 0) {
            const firstInvoice = await prisma.invoiceMaster.findFirst({
                orderBy: { invoice_date: 'desc' }
            });
            console.log("Latest Invoice Date:", firstInvoice?.invoice_date);
        }

        if (counts.receiptMaster > 0) {
            const firstReceipt = await prisma.receiptMaster.findFirst({
                orderBy: { receipt_date: 'desc' }
            });
            console.log("Latest Receipt Date:", firstReceipt?.receipt_date);
        }

    } catch (e) {
        console.error("Error checking rows:", e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
