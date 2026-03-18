# 📊 Advanced Analytics & Enterprise Admin Dashboard

A comprehensive, full-stack enterprise resource planning (ERP) and analytics dashboard designed to manage complex business operations including sales, subscription management, invoicing, user roles, packaging, and financial data. 

Built on a bleeding-edge tech stack featuring **Next.js 16**, **React 19**, **Prisma ORM**, and **Tailwind CSS v4**, this platform delivers performance, type-safety, and an incredible user experience.

---

## 🚀 Key Features

*   **Financial & Order Analytics**: View and manage complete workflows from `OrderMaster` to `InvoiceMaster` and `ReceiptMaster`. Includes integrated GST handling, HSN codes, and tax calculation.
*   **Subscription Management**: End-to-end subscription lifecycle covering periods, subscription box orders, packaging logic (`order_packaging_box`), and delivery assignment.
*   **Role-Based Access Control (RBAC)**: Fine-grained permissions and menu rendering dynamically based on `RoleMaster` and `permission_master`, ensuring security across system endpoints.
*   **Interactive Analytics & Charts**: Rich visual dashboards displaying financial analytics, built powered by `chart.js` and `react-chartjs-2`.

*   **Robust Data Architecture**: Backed by PostgreSQL and modeled perfectly using Prisma ORM with 40+ structured tables covering products, locations (Country/State/Taluka/AtPost), logistics, and banking schemas.

---

## 🛠 Tech Stack

**Frontend:**
*   **Framework:** [Next.js (App Router)](https://nextjs.org/) (v16.1.7)
*   **Library:** React 19
*   **Styling:** Tailwind CSS v4
*   **Icons:** Lucide React
*   **Charts:** Chart.js + react-chartjs-2

**Backend:**
*   **Logic:** Next.js Server Components & Route Handlers
*   **Database:** PostgreSQL
*   **ORM:** [Prisma](https://www.prisma.io/) (^6.19) w/ `@prisma/adapter-pg`
*   **Data Fetching:** Axios

**Tooling:**
*   TypeScript (^5)
*   ESLint (^9)

---

## 📂 Project Structure

```text
admin-dashboard/
├── app/                  # Next.js 14+ App Router: Pages, Layouts, API endpoints
│   ├── api/              # Backend route handlers
│   └── dashboard/        # Main interactive dashboard views
├── components/           # Reusable functional UI compontents (Charts, Magazine Viewers)
├── lib/                  # Core utility functions, DB connections (Prisma client)
├── prisma/               # Database schemas and migration configurations
│   └── schema.prisma     # Complex ERP schema with exhaustive relationship mappings
├── types/                # Strict TypeScript interfaces and type definitions
├── public/               # Static assets
└── tailwind.config.ts    # Tailwind styling configurations
```

---

## 🚦 Getting Started

### 1. Prerequisites
Ensure you have the following installed on your machine:
*   [Node.js](https://nodejs.org/en/) (v20+ recommended)
*   [PostgreSQL](https://www.postgresql.org/) database server running.

### 2. Installation Setup

Clone the repository and install the required dependencies:

```bash
# Enter the project directory
cd admin-dashboard

# Install packages
npm install
```

### 3. Environment Variables
Create a `.env` file in the root of `admin-dashboard` and supply your secrets. At a minimum, you must provide your PostgreSQL connection string:

```env
DATABASE_URL="postgresql://username:password@localhost:5432/your_database_name?schema=public"
```

### 4. Database Setup
Sync the advanced database schema from Prisma to your PostgreSQL instance and generate the client:

```bash
npx prisma generate
npx prisma db push
# or if using migration system: npx prisma migrate dev
```

### 5. Start Development Server
Run the local development server:

```bash
npm run dev
```

The application will be accessible at [http://localhost:3000](http://localhost:3000).

---

## 📜 Scripts

*   `npm run dev`: Starts the Next.js development server.
*   `npm run build`: Compiles the application for production deployment.
*   `npm run start`: Starts the production server.
*   `npm run lint`: Runs ESLint to check for code issues.

---
*Designed & Built for unparalleled analytics and dashboard experiences.*
