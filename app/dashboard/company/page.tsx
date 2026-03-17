"use client";

import { useEffect, useState } from "react";
import { Header } from "@/components/dashboard/Header";
import { StatCard } from "@/components/dashboard/StatCard";
import { ChartCard } from "@/components/dashboard/ChartCard";
import { DataTable } from "@/components/dashboard/DataTable";
import { BarChart } from "@/components/charts/BarChart";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { formatCurrency, formatNumber } from "@/lib/utils";
import {
    Building2,
    Users,
    ShoppingCart,
    CreditCard,
    RefreshCw,
    Settings,
    Eye,
} from "lucide-react";
import Image from "next/image";
import { Select } from "@/components/ui/Select";

export default function CompanyDashboardPage() {
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [selectedCompany, setSelectedCompany] = useState<string>("all");

    useEffect(() => {
        fetchCompanyData();
    }, []);

    const fetchCompanyData = async () => {
        setLoading(true);
        try {
            const res = await fetch("/api/dashboard/company");
            if (!res.ok) throw new Error("Failed to load company data");
            const json = await res.json();
            setData(json);
        } catch (err) {
            console.error("Company Dashboard Error:", err);
            setData(null);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-screen">
                <RefreshCw className="h-8 w-8 animate-spin text-blue-600" />
            </div>
        );
    }

    if (!data) {
        return (
            <div className="flex items-center justify-center h-screen">
                <p className="text-gray-500">Failed to load company dashboard</p>
            </div>
        );
    }

    const { companies, summary, revenueByCompany, ordersByCompany } = data;

    const companyOptions = [
        { value: "all", label: "All Companies" },
        ...companies.map((c: any) => ({ value: String(c.id), label: c.name })),
    ];

    const filteredCompanies =
        selectedCompany === "all"
            ? companies
            : companies.filter((c: any) => String(c.id) === selectedCompany);

    return (
        <div>
            <Header
                title="Companies"
                subtitle="Manage tenants, performance, and operations"
                rightActions={
                    <Select
                        value={selectedCompany}
                        onChange={setSelectedCompany}
                        options={companyOptions}
                        placeholder="Select Company"
                        className="w-56"
                    />
                }
            />

            <div className="p-8 space-y-8">
                {/* Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <StatCard
                        title="Total Companies"
                        value={summary.totalCompanies}
                        icon={Building2}
                        iconColor="text-blue-600"
                        iconBgColor="bg-blue-100"
                    />
                    <StatCard
                        title="Total Users"
                        value={summary.totalUsers}
                        icon={Users}
                        iconColor="text-green-600"
                        iconBgColor="bg-green-100"
                    />
                    <StatCard
                        title="Aggregate Revenue"
                        value={summary.totalRevenue}
                        icon={CreditCard}
                        format="currency"
                        iconColor="text-purple-600"
                        iconBgColor="bg-purple-100"
                    />
                    <StatCard
                        title="Total Orders"
                        value={filteredCompanies.reduce(
                            (sum: number, c: any) => sum + c.totalOrders,
                            0
                        )}
                        icon={ShoppingCart}
                        iconColor="text-orange-600"
                        iconBgColor="bg-orange-100"
                    />
                </div>

                {/* Revenue Performance Chart */}
                <ChartCard title="Revenue by Company" subtitle="Across all active tenants">
                    <BarChart
                        labels={revenueByCompany.map((r: any) => r.companyName)}
                        datasets={[
                            {
                                label: "Revenue",
                                data: revenueByCompany.map((r: any) => r.revenue),
                                backgroundColor: "#3b82f6",
                            },
                        ]}
                        horizontal
                    />
                </ChartCard>

                {/* Companies Table with KPIs */}
                <ChartCard title="Company Details" subtitle="Operational metrics per tenant">
                    <DataTable
                        columns={[
                            {
                                key: "logo",
                                header: "Logo",
                                render: (row: any) =>
                                    row.logo ? (
                                        <Image
                                            src={row.logo}
                                            alt={row.name}
                                            width={32}
                                            height={32}
                                            className="rounded"
                                        />
                                    ) : (
                                        <div className="h-8 w-8 bg-gray-200 rounded flex items-center justify-center text-xs">
                                            N/A
                                        </div>
                                    ),
                            },
                            { key: "name", header: "Company" },
                            {
                                key: "totalUsers",
                                header: "Users",
                                render: (row: any) => formatNumber(row.totalUsers),
                            },
                            {
                                key: "totalOrders",
                                header: "Orders",
                                render: (row: any) => formatNumber(row.totalOrders),
                            },
                            {
                                key: "totalRevenue",
                                header: "Revenue",
                                render: (row: any) => formatCurrency(row.totalRevenue),
                            },
                            {
                                key: "pendingInvoices",
                                header: "Pending",
                                render: (row: any) => formatNumber(row.pendingInvoices),
                            },
                            {
                                key: "status",
                                header: "Status",
                                render: (row: any) => (
                                    <span
                                        className={`px-2 py-0.5 rounded-full text-xs font-medium ${row.status === "active"
                                                ? "bg-green-100 text-green-800"
                                                : "bg-gray-100 text-gray-800"
                                            }`}
                                    >
                                        {row.status}
                                    </span>
                                ),
                            },
                            {
                                key: "actions",
                                header: "Actions",
                                render: (row: any) => (
                                    <div className="flex gap-2">
                                        <button className="p-1 hover:bg-gray-100 rounded" title="View Details">
                                            <Eye className="h-4 w-4" />
                                        </button>
                                        <button className="p-1 hover:bg-gray-100 rounded" title="Manage">
                                            <Settings className="h-4 w-4" />
                                        </button>
                                    </div>
                                ),
                            },
                        ]}
                        data={filteredCompanies}
                    />
                </ChartCard>

                {/* Per-company quick cards (optional but very useful) */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredCompanies.map((company: any) => (
                        <Card key={company.id} className="hover:shadow-md transition-shadow">
                            <CardHeader>
                                <div className="flex items-center gap-3">
                                    {company.logo ? (
                                        <Image
                                            src={company.logo}
                                            alt={company.name}
                                            width={40}
                                            height={40}
                                            className="rounded"
                                        />
                                    ) : (
                                        <div className="h-10 w-10 bg-gray-200 rounded flex items-center justify-center text-sm">
                                            {company.name[0]}
                                        </div>
                                    )}
                                    <div>
                                        <CardTitle>{company.name}</CardTitle>
                                        <p className="text-sm text-gray-500 mt-1">{company.email}</p>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-xs text-gray-500">Orders</p>
                                        <p className="text-lg font-semibold">
                                            {formatNumber(company.totalOrders)}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-500">Revenue</p>
                                        <p className="text-lg font-semibold">
                                            {formatCurrency(company.totalRevenue)}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-500">Users</p>
                                        <p className="text-lg font-semibold">
                                            {formatNumber(company.totalUsers)}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-500">Pending</p>
                                        <p className="text-lg font-semibold">
                                            {formatNumber(company.pendingInvoices)}
                                        </p>
                                    </div>
                                </div>
                                <div className="mt-4 flex justify-end">
                                    <button className="text-sm text-blue-600 hover:underline">
                                        View Dashboard
                                    </button>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>
        </div>
    );
}