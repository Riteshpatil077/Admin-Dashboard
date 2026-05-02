import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...");

  // 1. Country
  const country = await prisma.countryMaster.upsert({
    where: { country_code: "IN" },
    update: {},
    create: { country_name: "India", country_code: "IN", status: "ACTIVE", updated_at: new Date() },
  });

  // 2. State
  const state = await prisma.stateMaster.upsert({
    where: { state_code: "MH" },
    update: {},
    create: { state_name: "Maharashtra", state_code: "MH", countryId: country.id, status: "ACTIVE", updated_at: new Date() },
  });

  // 3. District
  let district = await prisma.districtMaster.findFirst({ where: { district_code: "PUN" } });
  if (!district) {
    district = await prisma.districtMaster.create({
      data: { district_name: "Pune", district_code: "PUN", stateId: state.id, status: "ACTIVE", updated_at: new Date() },
    });
  }

  // 4. Taluka
  let taluka = await prisma.talukaMaster.findFirst({ where: { taluka_code: "HVL" } });
  if (!taluka) {
    taluka = await prisma.talukaMaster.create({
      data: { taluka_name: "Haveli", taluka_code: "HVL", districtId: district.id, status: "ACTIVE", updated_at: new Date() },
    });
  }

  // 5. AtPost
  let atpost = await prisma.atPostMaster.findFirst({ where: { atpost_code: "KOT001" } });
  if (!atpost) {
    atpost = await prisma.atPostMaster.create({
      data: { atpost_name: "Kothrud", atpost_code: "KOT001", talukaId: taluka.id, status: "ACTIVE", updated_at: new Date() },
    });
  }

  // 6. Company
  const company = await prisma.companyMaster.upsert({
    where: { company_name: "Shree Traders Pvt Ltd" },
    update: {},
    create: {
      company_name: "Shree Traders Pvt Ltd",
      company_address: "Plot 12, MIDC, Pune - 411019",
      company_email_main: "info@shreetraders.com",
      company_mobile: "9876543210",
      company_gstin: "27AAPCS1234A1Z5",
      company_pan_number: "AAPCS1234A",
      company_website: "www.shreetraders.com",
      status: "active",
      atpost_id: atpost.id,
      country_id: country.id,
      district_id: district.id,
      state_id: state.id,
      taluka_id: taluka.id,
      pincode: "411019",
    },
  });

  // 7. User (no role yet)
  let adminUser = await prisma.user_master.findFirst({ where: { user_name: "admin" } });
  if (!adminUser) {
    adminUser = await prisma.user_master.create({
      data: {
        display_name: "Admin User",
        user_name: "admin",
        password_hash: "$2b$10$hashedpasswordhere",
        companyId: company.id,
        status: "ACTIVE",
        updated_at: new Date(),
      },
    });
  }

  // 8. Role
  const role = await prisma.roleMaster.upsert({
    where: { role_name: "Super Admin" },
    update: {},
    create: { role_name: "Super Admin", description: "Full access", user_id: adminUser.id, status: "ACTIVE" },
  });

  // Update user with role
  await prisma.user_master.update({ where: { id: adminUser.id }, data: { role_id: role.id } });

  // 9. Designation
  const desig = await prisma.designation_master.upsert({
    where: { designation_name: "Manager" },
    update: {},
    create: { designation_name: "Manager", user_id: adminUser.id, updated_at: new Date() },
  });

  // 10. HSN Code
  const hsn = await prisma.hsnCodeMaster.upsert({
    where: { hsn_code_effective_date: { hsn_code: "4901", effective_date: new Date("2023-01-01") } },
    update: {},
    create: {
      hsn_code: "4901",
      description: "Printed Books",
      gst_rate: 5.0,
      effective_date: new Date("2023-01-01"),
      user_id: adminUser.id,
      updated_at: new Date(),
    },
  });

  // 11. Service
  const service = await prisma.serviceMaster.upsert({
    where: { service_name: "Publication" },
    update: {},
    create: { service_name: "Publication", status: "ACTIVE", user_id: adminUser.id, updated_at: new Date() },
  });

  // 12. Product Category
  let pcat = await prisma.productCategoryMaster.findFirst({ where: { product_category_name: "Books" } });
  if (!pcat) {
    pcat = await prisma.productCategoryMaster.create({
      data: {
        product_category_name: "Books",
        service_id: service.id,
        user_id: adminUser.id,
        status: "ACTIVE",
        hsn_id: hsn.id,
      },
    });
  }

  // 13. Product Sub Category
  let psub = await prisma.productSubCategoryMaster.findFirst({ where: { product_sub_category_name: "Educational" } });
  if (!psub) {
    psub = await prisma.productSubCategoryMaster.create({
      data: {
        product_sub_category_name: "Educational",
        product_category_id: pcat.id,
        user_id: adminUser.id,
        status: "ACTIVE",
        updated_at: new Date(),
      },
    });
  }

  // 14. Products
  const productNames = ["Class 1 Maths", "Class 2 Science", "Class 3 English", "Class 4 Hindi", "Class 5 Social"];
  const products = [];
  for (let i = 0; i < productNames.length; i++) {
    let p = await prisma.productMaster.findFirst({ where: { product_code: `BOOK00${i + 1}` } });
    if (!p) {
      p = await prisma.productMaster.create({
        data: {
          product_name: productNames[i],
          product_code: `BOOK00${i + 1}`,
          service_id: service.id,
          product_category_id: pcat.id,
          product_subcategory_id: psub.id,
          user_id: adminUser.id,
          status: "ACTIVE",
        },
      });
    }
    products.push(p);
  }

  // 15. Customer Category
  let custCat = await prisma.customer_category_master.findFirst({ where: { category_name: "Retail" } });
  if (!custCat) {
    custCat = await prisma.customer_category_master.create({
      data: { category_name: "Retail", user_id: adminUser.id, updated_at: new Date() },
    });
  }

  // 16. Customer Sub Category
  let custSubCat = await prisma.customer_sub_category_master.findFirst({ where: { subcategory_name: "Individual" } });
  if (!custSubCat) {
    custSubCat = await prisma.customer_sub_category_master.create({
      data: { subcategory_name: "Individual", user_id: adminUser.id, category_id: custCat.id, updated_at: new Date() },
    });
  }

  // 17. Customers
  const customerData = [
    { code: "CUST001", name: "Rajesh Kumar Sharma", mobile: "9876500001", email: "rajesh@example.com" },
    { code: "CUST002", name: "Priya Patel", mobile: "9876500002", email: "priya@example.com" },
    { code: "CUST003", name: "Vikram Singh", mobile: "9876500003", email: "vikram@example.com" },
    { code: "CUST004", name: "Sunita Devi", mobile: "9876500004", email: "sunita@example.com" },
    { code: "CUST005", name: "Amit Joshi", mobile: "9876500005", email: "amit@example.com" },
    { code: "CUST006", name: "Meena Gupta", mobile: "9876500006", email: "meena@example.com" },
    { code: "CUST007", name: "Ravi Verma", mobile: "9876500007", email: "ravi@example.com" },
    { code: "CUST008", name: "Kavita Mishra", mobile: "9876500008", email: "kavita@example.com" },
    { code: "CUST009", name: "Suresh Yadav", mobile: "9876500009", email: "suresh@example.com" },
    { code: "CUST010", name: "Anjali Thakur", mobile: "9876500010", email: "anjali@example.com" },
  ];

  const customers = [];
  for (const cd of customerData) {
    let c = await prisma.customerMaster.findFirst({ where: { customer_code: cd.code } });
    if (!c) {
      c = await prisma.customerMaster.create({
        data: {
          customer_code: cd.code,
          customer_name: cd.name,
          mobile_number: cd.mobile,
          email: cd.email,
          country_id: country.id,
          state_id: state.id,
          district_id: district.id,
          taluka_id: taluka.id,
          at_post_id: atpost.id,
          category_id: custCat.id,
          subcategory_id: custSubCat.id,
          user_id: adminUser.id,
          pincode: "411019",
          updated_at: new Date(),
        },
      });
    }
    customers.push(c);
  }

  // 18. Contact Details
  const contacts = [];
  for (const cust of customers) {
    let contact = await prisma.customerContactDetailMaster.findFirst({ where: { customer_id: cust.id } });
    if (!contact) {
      contact = await prisma.customerContactDetailMaster.create({
        data: {
          contact_person_name: cust.customer_name,
          contact_person_number: cust.mobile_number || "9999999999",
          contact_type: "Primary",
          customer_id: cust.id,
          designation_id: desig.id,
          updated_at: new Date(),
        },
      });
    }
    contacts.push(contact);
  }

  // 19. Subscription Period
  let subPeriod = await prisma.subscription_period_master.findFirst({ where: { period_value: 12, period_type: "Month" } });
  if (!subPeriod) {
    subPeriod = await prisma.subscription_period_master.create({
      data: { period_value: 12, period_type: "Month", user_id: adminUser.id, updated_at: new Date() },
    });
  }

  // 20. Orders - generate for last 6 months
  const statuses = ["CONFIRMED", "PENDING", "DISPATCHED", "DELIVERED", "CANCELLED"];
  let orderCount = 0;

  for (let m = 5; m >= 0; m--) {
    const date = new Date();
    date.setMonth(date.getMonth() - m);
    date.setDate(Math.ceil(Math.random() * 28));

    for (let o = 0; o < 4; o++) {
      orderCount++;
      const cust = customers[orderCount % customers.length];
      const contact = contacts[orderCount % contacts.length];
      const status = statuses[o % statuses.length];
      const qty = Math.ceil(Math.random() * 10) + 1;
      const rate = 250.0;
      const taxable = qty * rate;
      const cgst = taxable * 0.025;
      const sgst = taxable * 0.025;
      const total = taxable + cgst + sgst;
      const voucherNo = `ORD-${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, "0")}-${String(orderCount).padStart(4, "0")}`;

      let order = await prisma.orderMaster.findFirst({ where: { order_voucher_no: voucherNo } });
      if (!order) {
        order = await prisma.orderMaster.create({
          data: {
            order_voucher_no: voucherNo,
            order_date: date,
            customer_id: cust.id,
            customer_contact_detail_id: contact.id,
            sub_total: taxable,
            total_tax_amount: cgst + sgst,
            grand_total_amount: total,
            user_id: adminUser.id,
            company_id: company.id,
            status,
          },
        });

        // Order item
        await prisma.orderItemDetail.create({
          data: {
            order_id: order.id,
            product_id: products[o % products.length].id,
            rate,
            quantity: qty,
            taxable_amount: taxable,
            hsn_id_snapshot: hsn.id,
            gst_rate_snapshot: 5.0,
            total_tax_amount: cgst + sgst,
            cgst_rate: 2.5,
            cgst_amount: cgst,
            sgst_rate: 2.5,
            sgst_amount: sgst,
            igst_rate: 0,
            igst_amount: 0,
          },
        });

        // Invoice for confirmed/delivered orders
        if (["CONFIRMED", "DELIVERED", "DISPATCHED"].includes(status)) {
          const invoiceNo = `INV-${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, "0")}-${String(orderCount).padStart(4, "0")}`;
          const paid = status === "DELIVERED" ? total : total * 0.5;
          const balance = total - paid;
          const payStatus = status === "DELIVERED" ? "PAID" : paid > 0 ? "PARTIAL" : "UNPAID";

          const inv = await prisma.invoiceMaster.upsert({
            where: { invoice_number: invoiceNo },
            update: {},
            create: {
              invoice_number: invoiceNo,
              invoice_date: date,
              sale_order_id: order.id,
              grand_total_amount: total,
              paid_amount: paid,
              balance_due: balance,
              payment_status: payStatus,
              status: "ISSUED",
              user_id: adminUser.id,
              company_id: company.id,
            },
          });

          // Receipt for paid ones
          if (paid > 0) {
            const receiptNo = `RCP-${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, "0")}-${String(orderCount).padStart(4, "0")}`;
            await prisma.receiptMaster.upsert({
              where: { receipt_voucher_no: receiptNo },
              update: {},
              create: {
                receipt_voucher_no: receiptNo,
                receipt_date: date,
                instrument_date: date,
                customer_id: cust.id,
                invoice_id: inv.id,
                mode: "ONLINE",
                sub_mode: "UPI",
                total_amount: paid,
                amount: paid,
                unused_amount: 0,
                status: "CLEARED",
                user_id: adminUser.id,
                updated_at: new Date(),
              },
            });
          }
        }
      }
    }
  }

  // 21. Subscriptions
  for (let i = 0; i < 5; i++) {
    const cust = customers[i];
    const contact = contacts[i];
    const date = new Date();
    date.setMonth(date.getMonth() - i);
    const start = new Date(date);
    const valid = new Date(start);
    valid.setFullYear(valid.getFullYear() + 1);
    const subNo = `SUB-2025-${String(i + 1).padStart(4, "0")}`;
    const qty = 5;
    const rate = 2500.0;
    const taxable = qty * rate;
    const cgst = taxable * 0.025;
    const sgst = taxable * 0.025;
    const total = taxable + cgst + sgst;

    let sub = await prisma.subscription_master.findFirst({ where: { subscription_voucher_no: subNo } });
    if (!sub) {
      sub = await prisma.subscription_master.create({
        data: {
          subscription_voucher_no: subNo,
          subscription_date: date,
          subscription_start_date: start,
          valid_upto_date: valid,
          customer_id: cust.id,
          customer_contact_detail_id: contact.id,
          subscription_period_id: subPeriod.id,
          sub_total: taxable,
          total_tax_amount: cgst + sgst,
          grand_total_amount: total,
          status: i < 3 ? "CONFIRMED" : "PENDING",
          validity_status: i < 4 ? "VALID" : "EXPIRED",
          user_id: adminUser.id,
          updated_at: new Date(),
        },
      });

      await prisma.subscription_item_detail.create({
        data: {
          subscription_id: sub.id,
          product_id: products[i % products.length].id,
          unit_price: rate,
          quantity: qty,
          taxable_amount: taxable,
          hsn_id_snapshot: hsn.id,
          gst_rate_snapshot: 5.0,
          total_tax_amount: cgst + sgst,
          cgst_rate: 2.5,
          cgst_amount: cgst,
          sgst_rate: 2.5,
          sgst_amount: sgst,
          igst_rate: 0,
          igst_amount: 0,
          user_id: adminUser.id,
        },
      });
    }
  }

  console.log("✅ Seed complete!");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
