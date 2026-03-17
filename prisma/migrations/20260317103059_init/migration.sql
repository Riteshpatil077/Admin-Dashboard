-- CreateTable
CREATE TABLE "company_master" (
    "id" SERIAL NOT NULL,
    "company_name" VARCHAR(255) NOT NULL,
    "company_address" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "company_email_main" VARCHAR(100),
    "company_email_other" VARCHAR(100),
    "company_gstin" VARCHAR(100),
    "company_logo_url" VARCHAR(255),
    "company_mobile" VARCHAR(15),
    "company_pan_number" VARCHAR(100),
    "company_phone" VARCHAR(15),
    "company_sign_url" VARCHAR(255),
    "company_website" VARCHAR(100),
    "other_contact" VARCHAR(15),
    "registration_no" VARCHAR(100),
    "atpost_id" INTEGER NOT NULL DEFAULT 1,
    "country_id" INTEGER NOT NULL DEFAULT 1,
    "district_id" INTEGER NOT NULL DEFAULT 1,
    "pincode" VARCHAR(10) NOT NULL DEFAULT '400001',
    "state_id" INTEGER NOT NULL DEFAULT 1,
    "taluka_id" INTEGER DEFAULT 1,

    CONSTRAINT "company_master_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_master" (
    "id" SERIAL NOT NULL,
    "display_name" VARCHAR(255) NOT NULL,
    "user_name" VARCHAR(100) NOT NULL,
    "password_hash" TEXT NOT NULL,
    "companyId" INTEGER NOT NULL,
    "status" VARCHAR(20) NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "role_id" INTEGER,

    CONSTRAINT "user_master_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "service_master" (
    "id" SERIAL NOT NULL,
    "service_name" VARCHAR(100) NOT NULL,
    "status" VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    "user_id" INTEGER NOT NULL,

    CONSTRAINT "service_master_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product_category_master" (
    "id" SERIAL NOT NULL,
    "product_category_name" VARCHAR(150) NOT NULL,
    "category_type" VARCHAR(50),
    "service_id" INTEGER NOT NULL,
    "user_id" INTEGER NOT NULL,
    "status" VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "hsn_id" INTEGER,

    CONSTRAINT "product_category_master_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product_master" (
    "id" SERIAL NOT NULL,
    "product_name" VARCHAR(255) NOT NULL,
    "product_code" VARCHAR(50) NOT NULL,
    "product_specification" TEXT,
    "service_id" INTEGER NOT NULL,
    "product_category_id" INTEGER NOT NULL,
    "product_subcategory_id" INTEGER NOT NULL,
    "user_id" INTEGER NOT NULL,
    "status" VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "product_master_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "order_master" (
    "id" SERIAL NOT NULL,
    "customer_id" INTEGER NOT NULL,
    "order_voucher_no" VARCHAR(50) NOT NULL,
    "order_date" DATE NOT NULL,
    "customer_contact_detail_id" INTEGER,
    "sub_total" DECIMAL(12,2) NOT NULL,
    "total_tax_amount" DECIMAL(12,2) NOT NULL,
    "courier_rate" DECIMAL(10,2) NOT NULL DEFAULT 0.0,
    "courier_charges_total" DECIMAL(10,2) NOT NULL DEFAULT 0.0,
    "grand_total_amount" DECIMAL(12,2) NOT NULL,
    "user_id" INTEGER NOT NULL,
    "status" VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "company_id" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "order_master_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "order_delivery_address" (
    "id" SERIAL NOT NULL,
    "order_id" INTEGER NOT NULL,
    "delivery_address" TEXT,

    CONSTRAINT "order_delivery_address_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "order_item_detail" (
    "id" SERIAL NOT NULL,
    "order_id" INTEGER NOT NULL,
    "product_id" INTEGER NOT NULL,
    "rate" DECIMAL(10,2) NOT NULL,
    "quantity" INTEGER NOT NULL,

    CONSTRAINT "order_item_detail_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "country_master" (
    "id" SERIAL NOT NULL,

    CONSTRAINT "country_master_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "state_master" (
    "id" SERIAL NOT NULL,

    CONSTRAINT "state_master_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "district_master" (
    "id" SERIAL NOT NULL,

    CONSTRAINT "district_master_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "taluka_master" (
    "id" SERIAL NOT NULL,

    CONSTRAINT "taluka_master_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "atpost_master" (
    "id" SERIAL NOT NULL,

    CONSTRAINT "atpost_master_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "role_master" (
    "id" SERIAL NOT NULL,

    CONSTRAINT "role_master_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "customer_master" (
    "id" SERIAL NOT NULL,

    CONSTRAINT "customer_master_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "invoice_master" (
    "id" SERIAL NOT NULL,
    "company_id" INTEGER NOT NULL,
    "order_id" INTEGER NOT NULL,

    CONSTRAINT "invoice_master_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hsn_code_master" (
    "id" SERIAL NOT NULL,

    CONSTRAINT "hsn_code_master_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product_sub_category_master" (
    "id" SERIAL NOT NULL,
    "category_id" INTEGER NOT NULL,

    CONSTRAINT "product_sub_category_master_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "customer_contact_detail_master" (
    "id" SERIAL NOT NULL,

    CONSTRAINT "customer_contact_detail_master_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SaleRateMaster" (
    "id" SERIAL NOT NULL,
    "service_id" INTEGER NOT NULL,
    "category_id" INTEGER NOT NULL,
    "product_id" INTEGER NOT NULL,

    CONSTRAINT "SaleRateMaster_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SubscriptionRateMaster" (
    "id" SERIAL NOT NULL,
    "service_id" INTEGER NOT NULL,
    "category_id" INTEGER NOT NULL,

    CONSTRAINT "SubscriptionRateMaster_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SubscriptionItemDetail" (
    "id" SERIAL NOT NULL,
    "product_id" INTEGER NOT NULL,

    CONSTRAINT "SubscriptionItemDetail_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "company_master_company_name_key" ON "company_master"("company_name");

-- CreateIndex
CREATE UNIQUE INDEX "user_master_user_name_key" ON "user_master"("user_name");

-- CreateIndex
CREATE UNIQUE INDEX "service_master_service_name_key" ON "service_master"("service_name");

-- CreateIndex
CREATE UNIQUE INDEX "order_delivery_address_order_id_key" ON "order_delivery_address"("order_id");

-- CreateIndex
CREATE UNIQUE INDEX "invoice_master_order_id_key" ON "invoice_master"("order_id");

-- AddForeignKey
ALTER TABLE "company_master" ADD CONSTRAINT "company_master_atpost_id_fkey" FOREIGN KEY ("atpost_id") REFERENCES "atpost_master"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "company_master" ADD CONSTRAINT "company_master_country_id_fkey" FOREIGN KEY ("country_id") REFERENCES "country_master"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "company_master" ADD CONSTRAINT "company_master_district_id_fkey" FOREIGN KEY ("district_id") REFERENCES "district_master"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "company_master" ADD CONSTRAINT "company_master_state_id_fkey" FOREIGN KEY ("state_id") REFERENCES "state_master"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "company_master" ADD CONSTRAINT "company_master_taluka_id_fkey" FOREIGN KEY ("taluka_id") REFERENCES "taluka_master"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_master" ADD CONSTRAINT "user_master_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "company_master"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_master" ADD CONSTRAINT "user_master_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "role_master"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "service_master" ADD CONSTRAINT "service_master_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user_master"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_category_master" ADD CONSTRAINT "product_category_master_hsn_id_fkey" FOREIGN KEY ("hsn_id") REFERENCES "hsn_code_master"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_category_master" ADD CONSTRAINT "product_category_master_service_id_fkey" FOREIGN KEY ("service_id") REFERENCES "service_master"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_category_master" ADD CONSTRAINT "product_category_master_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user_master"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_master" ADD CONSTRAINT "product_master_product_category_id_fkey" FOREIGN KEY ("product_category_id") REFERENCES "product_category_master"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_master" ADD CONSTRAINT "product_master_product_subcategory_id_fkey" FOREIGN KEY ("product_subcategory_id") REFERENCES "product_sub_category_master"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_master" ADD CONSTRAINT "product_master_service_id_fkey" FOREIGN KEY ("service_id") REFERENCES "service_master"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_master" ADD CONSTRAINT "product_master_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user_master"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_master" ADD CONSTRAINT "order_master_customer_contact_detail_id_fkey" FOREIGN KEY ("customer_contact_detail_id") REFERENCES "customer_contact_detail_master"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_master" ADD CONSTRAINT "order_master_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customer_master"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_master" ADD CONSTRAINT "order_master_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user_master"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_master" ADD CONSTRAINT "order_master_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "company_master"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_delivery_address" ADD CONSTRAINT "order_delivery_address_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "order_master"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_item_detail" ADD CONSTRAINT "order_item_detail_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "order_master"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_item_detail" ADD CONSTRAINT "order_item_detail_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "product_master"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoice_master" ADD CONSTRAINT "invoice_master_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "company_master"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoice_master" ADD CONSTRAINT "invoice_master_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "order_master"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_sub_category_master" ADD CONSTRAINT "product_sub_category_master_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "product_category_master"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SaleRateMaster" ADD CONSTRAINT "SaleRateMaster_service_id_fkey" FOREIGN KEY ("service_id") REFERENCES "service_master"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SaleRateMaster" ADD CONSTRAINT "SaleRateMaster_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "product_category_master"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SaleRateMaster" ADD CONSTRAINT "SaleRateMaster_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "product_master"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SubscriptionRateMaster" ADD CONSTRAINT "SubscriptionRateMaster_service_id_fkey" FOREIGN KEY ("service_id") REFERENCES "service_master"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SubscriptionRateMaster" ADD CONSTRAINT "SubscriptionRateMaster_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "product_category_master"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SubscriptionItemDetail" ADD CONSTRAINT "SubscriptionItemDetail_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "product_master"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
