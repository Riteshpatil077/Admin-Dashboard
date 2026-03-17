"use client";

import { useEffect, useState } from "react";
import { Header } from "@/components/dashboard/Header";
import { ChartCard } from "@/components/dashboard/ChartCard";
import { DataTable } from "@/components/dashboard/DataTable";
import { BarChart } from "@/components/charts/BarChart";
import { LineChart } from "@/components/charts/LineChart";
import { DoughnutChart } from "@/components/charts/DoughnutChart";
import { PieChart } from "@/components/charts/PieChart";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { formatCurrency, formatNumber } from "@/lib/utils";
import { RefreshCw, TrendingUp, MapPin, Tags } from "lucide-react";

export default function AnalyticsPage() {
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchAnalytics();
    }, []);

    const fetchAnalytics = async () => {
        setLoading(true);
        try {
            const res = await fetch("/api/dashboard/analytics");
            const json = await res.json();
            setData(json);
        } catch (error) {
            console.error("Failed to fetch analytics:", error);
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
                <p className="text-gray-500">Failed to load analytics</p>
            </div>
        );
    }

    return (
        <div>
            <Header
                title="Analytics"
                subtitle="Deep insights into your business performance"
            />

            <div className="p-8 space-y-8">
                {/* GST Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <Card>
                        <CardContent className="pt-6">
                            <p className="text-sm text-gray-500">Total CGST</p>
                            <p className="text-2xl font-bold text-blue-600">
                                {formatCurrency(data.gstSummary.cgst)}
                            </p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="pt-6">
                            <p className="text-sm text-gray-500">Total SGST</p>
                            <p className="text-2xl font-bold text-green-600">
                                {formatCurrency(data.gstSummary.sgst)}
                            </p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="pt-6">
                            <p className="text-sm text-gray-500">Total IGST</p>
                            <p className="text-2xl font-bold text-orange-600">
                                {formatCurrency(data.gstSummary.igst)}
                            </p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="pt-6">
                            <p className="text-sm text-gray-500">Total Tax</p>
                            <p className="text-2xl font-bold text-purple-600">
                                {formatCurrency(data.gstSummary.total)}
                            </p>
                        </CardContent>
                    </Card>
                </div>

                {/* Year Comparison */}
                <ChartCard
                    title="Revenue Comparison"
                    subtitle="Current Year vs Previous Year"
                >
                    <LineChart
                        labels={data.monthlyComparison.map((m: any) => m.month)}
                        datasets={[
                            {
                                label: "Current Year",
                                data: data.monthlyComparison.map((m: any) => m.currentYear),
                                borderColor: "#3b82f6",
                            },
                            {
                                label: "Previous Year",
                                data: data.monthlyComparison.map((m: any) => m.previousYear),
                                borderColor: "#9ca3af",
                            },
                        ]}
                        showArea
                    />
                </ChartCard>

                {/* Charts Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <ChartCard title="Revenue by Category" subtitle="Product categories">
                        <BarChart
                            labels={data.revenueByCategory.map((r: any) => r.category)}
                            datasets={[
                                {
                                    label: "Revenue",
                                    data: data.revenueByCategory.map((r: any) => r.revenue),
                                    backgroundColor: "#3b82f6",
                                },
                            ]}
                            horizontal
                        />
                    </ChartCard>

                    <ChartCard
                        title="Customer Distribution"
                        subtitle="By customer category"
                    >
                        <PieChart
                            labels={data.customersByCategory.map((c: any) => c.category)}
                            data={data.customersByCategory.map((c: any) => c.count)}
                        />
                    </ChartCard>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <ChartCard
                        title="State-wise Orders"
                        subtitle="Geographic distribution"
                    >
                        <BarChart
                            labels={data.stateWiseOrders.map((s: any) => s.state)}
                            datasets={[
                                {
                                    label: "Orders",
                                    data: data.stateWiseOrders.map((s: any) => s.orders),
                                    backgroundColor: "#10b981",
                                },
                            ]}
                            horizontal
                        />
                    </ChartCard>

                    <ChartCard
                        title="Subscription Plans"
                        subtitle="By subscription period"
                    >
                        <DoughnutChart
                            labels={data.subscriptionAnalytics.map((s: any) => s.period)}
                            data={data.subscriptionAnalytics.map((s: any) => s.count)}
                        />
                    </ChartCard>
                </div>

                {/* Top Products Table */}
                <ChartCard title="Top Products" subtitle="By revenue">
                    <DataTable
                        columns={[
                            { key: "name", header: "Product Name" },
                            { key: "category", header: "Category" },
                            {
                                key: "quantity",
                                header: "Qty Sold",
                                render: (row: any) => formatNumber(row.quantity),
                            },
                            {
                                key: "revenue",
                                header: "Revenue",
                                render: (row: any) => formatCurrency(row.revenue),
                            },
                        ]}
                        data={data.topProducts}
                    />
                </ChartCard>
            </div>
        </div>
    );
}