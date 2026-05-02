import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database with 50+ records...");

  // 1. Country & State
  const country = await prisma.countryMaster.upsert({
    where: { country_code: "IN" },
    update: {},
    create: { country_name: "India", country_code: "IN", status: "ACTIVE", updated_at: new Date() },
  });

  const state = await prisma.stateMaster.upsert({
    where: { state_code: "MH" },
    update: {},
    create: { state_name: "Maharashtra", state_code: "MH", countryId: country.id, status: "ACTIVE", updated_at: new Date() },
  });

  // 2. Districts & Talukas
  const districts = ["Pune", "Mumbai", "Nagpur", "Nashik"];
  const districtDocs = [];
  for (const d of districts) {
    let dist = await prisma.districtMaster.findFirst({ where: { district_code: d.substring(0, 3).toUpperCase() } });
    if (!dist) {
      dist = await prisma.districtMaster.create({
        data: { district_name: d, district_code: d.substring(0, 3).toUpperCase(), stateId: state.id, status: "ACTIVE", updated_at: new Date() },
      });
    }
    districtDocs.push(dist);
  }

  let taluka = await prisma.talukaMaster.findFirst({ where: { taluka_code: "HVL" } });
  if (!taluka) {
    taluka = await prisma.talukaMaster.create({
      data: { taluka_name: "Haveli", taluka_code: "HVL", districtId: districtDocs[0].id, status: "ACTIVE", updated_at: new Date() },
    });
  }

  let atpost = await prisma.atPostMaster.findFirst({ where: { atpost_code: "KOT001" } });
  if (!atpost) {
    atpost = await prisma.atPostMaster.create({
      data: { atpost_name: "Kothrud", atpost_code: "KOT001", talukaId: taluka.id, status: "ACTIVE", updated_at: new Date() },
    });
  }

  // 3. Companies (3 Companies)
  const companyData = [
    { name: "Shree Traders Pvt Ltd", code: "STPL", email: "info@shreetraders.com" },
    { name: "TechNova Solutions", code: "TNS", email: "contact@technova.com" },
    { name: "Global Exports", code: "GEX", email: "sales@globalexports.in" }
  ];
  
  const companies = [];
  for (const cd of companyData) {
    let comp = await prisma.companyMaster.findFirst({ where: { company_name: cd.name } });
    if (!comp) {
      comp = await prisma.companyMaster.create({
        data: {
          company_name: cd.name,
          company_address: "MIDC Sector, " + cd.name,
          company_email_main: cd.email,
          company_mobile: "9876543210",
          company_gstin: "27AAPCS1234A1Z5",
          status: "active",
          atpost_id: atpost.id,
          country_id: country.id,
          district_id: districtDocs[0].id,
          state_id: state.id,
          taluka_id: taluka.id,
          pincode: "411019",
        },
      });
    }
    companies.push(comp);
  }

  // 4. Admin User
  let adminUser = await prisma.user_master.findFirst({ where: { user_name: "admin" } });
  if (!adminUser) {
    adminUser = await prisma.user_master.create({
      data: {
        display_name: "Admin User",
        user_name: "admin",
        password_hash: "$2b$10$hashedpasswordhere",
        companyId: companies[0].id,
        status: "ACTIVE",
        updated_at: new Date(),
      },
    });
  }

  // 5. Designation & Categories
  const desig = await prisma.designation_master.upsert({
    where: { designation_name: "Manager" },
    update: {},
    create: { designation_name: "Manager", user_id: adminUser.id, updated_at: new Date() },
  });

  let custCat = await prisma.customer_category_master.findFirst({ where: { category_name: "Retail" } });
  if (!custCat) {
    custCat = await prisma.customer_category_master.create({
      data: { category_name: "Retail", user_id: adminUser.id, updated_at: new Date() },
    });
  }

  let custSubCat = await prisma.customer_sub_category_master.findFirst({ where: { subcategory_name: "Individual" } });
  if (!custSubCat) {
    custSubCat = await prisma.customer_sub_category_master.create({
      data: { subcategory_name: "Individual", user_id: adminUser.id, category_id: custCat.id, updated_at: new Date() },
    });
  }

  // 6. Products & Services
  const hsn = await prisma.hsnCodeMaster.upsert({
    where: { hsn_code_effective_date: { hsn_code: "4901", effective_date: new Date("2023-01-01") } },
    update: {},
    create: { hsn_code: "4901", description: "Printed Goods", gst_rate: 5.0, effective_date: new Date("2023-01-01"), user_id: adminUser.id, updated_at: new Date() },
  });

  const service = await prisma.serviceMaster.upsert({
    where: { service_name: "Products" },
    update: {},
    create: { service_name: "Products", status: "ACTIVE", user_id: adminUser.id, updated_at: new Date() },
  });

  let pcat = await prisma.productCategoryMaster.findFirst({ where: { product_category_name: "General" } });
  if (!pcat) {
    pcat = await prisma.productCategoryMaster.create({
      data: { product_category_name: "General", service_id: service.id, user_id: adminUser.id, status: "ACTIVE", hsn_id: hsn.id },
    });
  }

  let psub = await prisma.productSubCategoryMaster.findFirst({ where: { product_sub_category_name: "Items" } });
  if (!psub) {
    psub = await prisma.productSubCategoryMaster.create({
      data: { product_sub_category_name: "Items", product_category_id: pcat.id, user_id: adminUser.id, status: "ACTIVE", updated_at: new Date() },
    });
  }

  // Generate 20 Products
  const products = [];
  for (let i = 1; i <= 20; i++) {
    let p = await prisma.productMaster.findFirst({ where: { product_code: `PRD0${i}` } });
    if (!p) {
      p = await prisma.productMaster.create({
        data: {
          product_name: `Enterprise Product ${i}`,
          product_code: `PRD0${i}`,
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

  // 7. Customers (55 Customers)
  const firstNames = ["Raj", "Amit", "Priya", "Neha", "Rahul", "Vikram", "Sneha", "Karan", "Pooja", "Arun", "Suresh", "Meena", "Ravi", "Anjali", "Sanjay", "Kavita", "Gaurav", "Nisha", "Manoj", "Kiran"];
  const lastNames = ["Sharma", "Patel", "Singh", "Kumar", "Gupta", "Joshi", "Deshmukh", "Verma", "Thakur", "Yadav", "Mishra", "Pandey", "Chauhan", "Bose", "Reddy", "Nair", "Iyer", "Rao", "Das", "Roy"];
  
  const customers = [];
  const contacts = [];
  
  for (let i = 1; i <= 55; i++) {
    const name = `${firstNames[i % firstNames.length]} ${lastNames[i % lastNames.length]} ${i}`;
    const code = `CUST${String(i).padStart(4, "0")}`;
    const mobile = `9876${String(Math.floor(Math.random() * 1000000)).padStart(6, "0")}`;
    
    let c = await prisma.customerMaster.findFirst({ where: { customer_code: code } });
    if (!c) {
      c = await prisma.customerMaster.create({
        data: {
          customer_code: code,
          customer_name: name,
          mobile_number: mobile,
          email: `user${i}@example.com`,
          country_id: country.id,
          state_id: state.id,
          district_id: districtDocs[i % districtDocs.length].id,
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

    let contact = await prisma.customerContactDetailMaster.findFirst({ where: { customer_id: c.id } });
    if (!contact) {
      contact = await prisma.customerContactDetailMaster.create({
        data: {
          contact_person_name: name,
          contact_person_number: mobile,
          contact_type: "Primary",
          customer_id: c.id,
          designation_id: desig.id,
          updated_at: new Date(),
        },
      });
    }
    contacts.push(contact);
  }

  // 8. Orders & Invoices (150 Orders across 12 months)
  const statuses = ["CONFIRMED", "DELIVERED", "DELIVERED", "PENDING", "DISPATCHED", "CANCELLED"];
  let orderCount = 0;

  for (let m = 11; m >= 0; m--) {
    const ordersThisMonth = Math.floor(Math.random() * 10) + 10; // 10-20 orders per month

    for (let o = 0; o < ordersThisMonth; o++) {
      orderCount++;
      const date = new Date();
      date.setMonth(date.getMonth() - m);
      date.setDate(Math.floor(Math.random() * 28) + 1);

      const custIdx = Math.floor(Math.random() * customers.length);
      const cust = customers[custIdx];
      const contact = contacts[custIdx];
      const status = statuses[Math.floor(Math.random() * statuses.length)];
      const comp = companies[Math.floor(Math.random() * companies.length)];
      
      const qty = Math.floor(Math.random() * 50) + 5;
      const rate = Math.floor(Math.random() * 1000) + 100;
      const taxable = qty * rate;
      const cgst = taxable * 0.025;
      const sgst = taxable * 0.025;
      const total = taxable + cgst + sgst;
      
      const voucherNo = `ORD-${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, "0")}-${String(orderCount).padStart(5, "0")}`;

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
            company_id: comp.id,
            status,
            created_at: date,
          },
        });

        await prisma.orderItemDetail.create({
          data: {
            order_id: order.id,
            product_id: products[Math.floor(Math.random() * products.length)].id,
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
            created_at: date,
          },
        });

        if (["CONFIRMED", "DELIVERED", "DISPATCHED"].includes(status)) {
          const invoiceNo = `INV-${voucherNo.split("-")[1]}-${voucherNo.split("-")[2]}`;
          // Randomized payment scenarios
          const paymentScenario = Math.random();
          let paid = 0;
          let payStatus = "UNPAID";

          if (paymentScenario > 0.4) {
             paid = total; // Fully paid
             payStatus = "PAID";
          } else if (paymentScenario > 0.2) {
             paid = total * 0.5; // 50% paid
             payStatus = "PARTIAL";
          }

          const balance = total - paid;

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
              company_id: comp.id,
              created_at: date,
            },
          });

          if (paid > 0) {
            const receiptNo = `RCP-${invoiceNo.split("-")[1]}-${invoiceNo.split("-")[2]}`;
            const modes = ["ONLINE", "CHEQUE", "CASH"];
            const mode = modes[Math.floor(Math.random() * modes.length)];
            
            await prisma.receiptMaster.upsert({
              where: { receipt_voucher_no: receiptNo },
              update: {},
              create: {
                receipt_voucher_no: receiptNo,
                receipt_date: date,
                instrument_date: date,
                customer_id: cust.id,
                invoice_id: inv.id,
                mode: mode,
                sub_mode: mode === "ONLINE" ? "UPI" : mode === "CHEQUE" ? "CLEARING" : "HAND",
                total_amount: paid,
                amount: paid,
                unused_amount: 0,
                status: "CLEARED",
                user_id: adminUser.id,
                created_at: date,
                updated_at: new Date(),
              },
            });
          }
        }
      }
    }
  }

  // 9. Subscriptions (60 Subscriptions)
  let subPeriod = await prisma.subscription_period_master.findFirst({ where: { period_value: 12, period_type: "Month" } });
  if (!subPeriod) {
    subPeriod = await prisma.subscription_period_master.create({
      data: { period_value: 12, period_type: "Month", user_id: adminUser.id, updated_at: new Date() },
    });
  }

  for (let i = 1; i <= 60; i++) {
    const cust = customers[i % customers.length];
    const contact = contacts[i % contacts.length];
    const date = new Date();
    date.setMonth(date.getMonth() - (i % 12));
    date.setDate(Math.floor(Math.random() * 28) + 1);
    
    const start = new Date(date);
    const valid = new Date(start);
    valid.setFullYear(valid.getFullYear() + 1);
    
    const subNo = `SUB-2025-${String(i).padStart(4, "0")}`;
    const qty = Math.floor(Math.random() * 10) + 1;
    const rate = 5000.0;
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
          status: i % 5 === 0 ? "PENDING" : "CONFIRMED",
          validity_status: valid < new Date() ? "EXPIRED" : "VALID",
          user_id: adminUser.id,
          created_at: date,
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

  console.log("✅ Mega Seed complete! 55 Customers, 150+ Orders, 60 Subscriptions.");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
