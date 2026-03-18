/*
  Warnings:

  - A unique constraint covering the columns `[customer_code]` on the table `customer_master` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[invoice_no]` on the table `invoice_master` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "customer_master" ADD COLUMN     "company_id" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN     "customer_code" VARCHAR(50),
ADD COLUMN     "customer_name" VARCHAR(255),
ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'ACTIVE';

-- AlterTable
ALTER TABLE "invoice_master" ADD COLUMN     "balance_due" DECIMAL(12,2) NOT NULL DEFAULT 0,
ADD COLUMN     "customer_id" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN     "grand_total_amount" DECIMAL(12,2) NOT NULL DEFAULT 0,
ADD COLUMN     "invoice_date" DATE,
ADD COLUMN     "invoice_no" VARCHAR(50),
ADD COLUMN     "payment_status" VARCHAR(20) NOT NULL DEFAULT 'UNPAID',
ADD COLUMN     "status" VARCHAR(20) NOT NULL DEFAULT 'ACTIVE';

-- CreateTable
CREATE TABLE "receipt_master" (
    "id" SERIAL NOT NULL,
    "receipt_voucher_no" VARCHAR(50) NOT NULL,
    "receipt_date" DATE NOT NULL,
    "customer_id" INTEGER NOT NULL,
    "total_amount" DECIMAL(12,2) NOT NULL,
    "unused_amount" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "status" VARCHAR(20) NOT NULL DEFAULT 'CLEARED',
    "mode" VARCHAR(50) NOT NULL,
    "sub_mode" VARCHAR(50),
    "receiving_bank_id" INTEGER,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "receipt_master_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "customer_master_customer_code_key" ON "customer_master"("customer_code");

-- CreateIndex
CREATE UNIQUE INDEX "invoice_master_invoice_no_key" ON "invoice_master"("invoice_no");

-- AddForeignKey
ALTER TABLE "invoice_master" ADD CONSTRAINT "invoice_master_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customer_master"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "receipt_master" ADD CONSTRAINT "receipt_master_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customer_master"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
