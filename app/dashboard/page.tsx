"use client";

import { useEffect, useState } from "react";
import { Header } from "@/components/dashboard/Header";
import { StatCard } from "@/components/dashboard/StatCard";
import { ChartCard } from "@/components/dashboard/ChartCard";
import { DataTable } from "@/components/dashboard/DataTable";
import { BarChart } from "@/components/charts/BarChart";
import { DoughnutChart } from "@/components/charts/DoughnutChart";
import { Badge } from "@/components/ui/Badge";
import { formatCurrency } from "@/lib/utils";
import {
    Users,
    ShoppingCart,
    CreditCard,
    Package,
    Clock,
    RefreshCw,
} from "lucide-react";

export default function DashboardPage() {
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchDashboard();
    }, []);

    const fetchDashboard = async () => {
        setLoading(true);
        try {
            const res = await fetch("/api/dashboard/basic");
            const json = await res.json();
            setData(json);
        } catch (error) {
            console.error("Failed to fetch dashboard:", error);
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

    // --- FIX 1: Defensive Destructuring with Defaults ---
    const {
        stats = {},
        charts = { ordersByMonth: [], orderStatusDistribution: [] },
        tables = { recentOrders: [], topCustomers: [] }
    } = data || {};

    return (
        <div>
            <Header title="Dashboard" subtitle="Welcome back! Here's what's happening." />

            <div className="p-8 space-y-8">
                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <StatCard
                        title="Total Customers"
                        value={stats?.totalCustomers ?? 0} // FIX 2: Optional Chaining + Nullish Coalescing
                        icon={Users}
                        iconColor="text-blue-600"
                        iconBgColor="bg-blue-100"
                    />
                    <StatCard
                        title="Total Orders"
                        value={stats?.totalOrders ?? 0}
                        icon={ShoppingCart}
                        iconColor="text-green-600"
                        iconBgColor="bg-green-100"
                    />
                    <StatCard
                        title="Monthly Revenue"
                        value={stats?.monthlyRevenue ?? 0}
                        icon={CreditCard}
                        format="currency"
                        trend={stats?.revenueGrowth}
                        iconColor="text-purple-600"
                        iconBgColor="bg-purple-100"
                    />
                    <StatCard
                        title="Active Subscriptions"
                        value={stats?.activeSubscriptions ?? 0}
                        icon={Package}
                        iconColor="text-orange-600"
                        iconBgColor="bg-orange-100"
                    />
                </div>

                {/* Secondary Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <StatCard
                        title="Total Revenue"
                        value={stats?.totalRevenue ?? 0}
                        icon={CreditCard}
                        format="currency"
                        iconColor="text-emerald-600"
                        iconBgColor="bg-emerald-100"
                    />
                    <StatCard
                        title="Pending Orders"
                        value={stats?.pendingOrders ?? 0}
                        icon={Clock}
                        iconColor="text-yellow-600"
                        iconBgColor="bg-yellow-100"
                    />
                    <StatCard
                        title="Total Products"
                        value={stats?.totalProducts ?? 0}
                        icon={Package}
                        iconColor="text-indigo-600"
                        iconBgColor="bg-indigo-100"
                    />
                </div>

                {/* Charts Row */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <ChartCard title="Orders & Revenue Trend" subtitle="Last 6 months">
                        <BarChart
                            labels={charts?.ordersByMonth?.map((o: any) => o.month) || []}
                            datasets={[
                                {
                                    label: "Orders",
                                    data: charts?.ordersByMonth?.map((o: any) => o.orders) || [],
                                    backgroundColor: "#3b82f6",
                                },
                                {
                                    label: "Revenue (₹K)",
                                    data: charts?.ordersByMonth?.map(
                                        (o: any) => (o.revenue || 0) / 1000
                                    ) || [],
                                    backgroundColor: "#10b981",
                                },
                            ]}
                        />
                    </ChartCard>

                    <ChartCard title="Order Status" subtitle="Distribution">
                        <DoughnutChart
                            labels={charts?.orderStatusDistribution?.map((s: any) => s.status) || []}
                            data={charts?.orderStatusDistribution?.map((s: any) => s.count) || []}
                        />
                    </ChartCard>
                </div>

                {/* Tables Row */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <ChartCard title="Recent Orders" subtitle="Latest 5 orders">
                        <DataTable
                            columns={[
                                { key: "voucherNo", header: "Voucher No" },
                                { key: "customer", header: "Customer" },
                                {
                                    key: "amount",
                                    header: "Amount",
                                    render: (row: any) => formatCurrency(row.amount || 0),
                                },
                                {
                                    key: "status",
                                    header: "Status",
                                    render: (row: any) => <Badge status={row.status} />,
                                },
                            ]}
                            data={tables?.recentOrders || []}
                        />
                    </ChartCard>

                    <ChartCard title="Top Customers" subtitle="By revenue">
                        <DataTable
                            columns={[
                                { key: "name", header: "Customer" },
                                { key: "code", header: "Code" },
                                { key: "totalOrders", header: "Orders" },
                                {
                                    key: "totalRevenue",
                                    header: "Revenue",
                                    render: (row: any) => formatCurrency(row.totalRevenue || 0),
                                },
                            ]}
                            data={tables?.topCustomers || []}
                        />
                    </ChartCard>
                </div>
            </div>
        </div>
    );
}