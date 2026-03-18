"use client";

import { useEffect, useState } from "react";
import { Header } from "@/components/dashboard/Header";
import { StatCard } from "@/components/dashboard/StatCard";
import { ChartCard } from "@/components/dashboard/ChartCard";
import { DataTable } from "@/components/dashboard/DataTable";
import { BarChart } from "@/components/charts/BarChart";
import { LineChart } from "@/components/charts/LineChart";
import { DoughnutChart } from "@/components/charts/DoughnutChart";
import { Badge } from "@/components/ui/Badge";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Select } from "@/components/ui/Select";
import { formatCurrency, formatNumber, formatPercentage } from "@/lib/utils";
import {
    Wallet,
    ArrowDownLeft,
    ArrowUpRight,
    Clock,
    RefreshCw,
    AlertTriangle,
    Building2,
    CreditCard,
} from "lucide-react";
export default function FinancialPage() {
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [startDate, setStartDate] = useState(new Date(new Date().setDate(new Date().getDate() - 30)));
    const [endDate, setEndDate] = useState(new Date());
    const [selectedCompanyId, setSelectedCompanyId] = useState<string>("all");

    useEffect(() => {
        fetchFinancial();
    }, [startDate, endDate, selectedCompanyId]);

    const fetchFinancial = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams({
                startDate: startDate.toISOString(),
                endDate: endDate.toISOString(),
                companyId: selectedCompanyId,
            });
            const res = await fetch(`/api/dashboard/financial?${params.toString()}`);
            if (!res.ok) throw new Error("Failed to load financial data");
            const json = await res.json();
            setData(json);
        } catch (err) {
            console.error("Financial Dashboard Error:", err);
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
            <div className="flex flex-col items-center justify-center h-screen gap-4 text-gray-600">
                <AlertTriangle className="h-10 w-10" />
                <p className="font-medium">Unable to load financial dashboard.</p>
                <button
                    onClick={fetchFinancial}
                    className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700"
                >
                    Retry
                </button>
            </div>
        );
    }

    const {
        summary,
        invoiceAging,
        monthlyCollections,
        topDebtors,
        paymentModes,
        recentReceipts,
        paymentStatusDistribution,
        bankCollections,
    } = data;

    const statusColors: Record<string, string> = {
        UNPAID: "#ef4444",
        PARTIAL: "#f59e0b",
        PAID: "#10b981",
    };

    return (
        <div>
            <Header
                title="Financial Dashboard"
                subtitle="Track receivables, collections, and cash flow"
                startDate={startDate}
                endDate={endDate}
                onDateChange={(s, e) => {
                    setStartDate(s);
                    setEndDate(e);
                }}
                rightActions={
                    <div className="flex items-center gap-3">
                        <Select
                            value={selectedCompanyId}
                            onChange={setSelectedCompanyId}
                            options={[
                                { value: "all", label: "All Companies" },
                                // In multi-company mode, populate from company API (next step)
                            ]}
                            placeholder="Company"
                            className="w-48"
                        />
                    </div>
                }
            />

            <div className="p-8 space-y-8">
                {/* Financial Summary */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <StatCard
                        title="Total Receivables"
                        value={summary.totalReceivables}
                        icon={ArrowDownLeft}
                        format="currency"
                        iconColor="text-red-600"
                        iconBgColor="bg-red-100"
                    />
                    <StatCard
                        title="Total Collected"
                        value={summary.totalReceived}
                        icon={ArrowUpRight}
                        format="currency"
                        iconColor="text-green-600"
                        iconBgColor="bg-green-100"
                    />
                    <StatCard
                        title="Advance Balance"
                        value={summary.advanceBalance}
                        icon={Wallet}
                        format="currency"
                        iconColor="text-blue-600"
                        iconBgColor="bg-blue-100"
                    />
                    <StatCard
                        title="Collection Rate"
                        value={formatPercentage(summary.collectionRate)}
                        icon={Clock}
                        format="none"
                        iconColor="text-purple-600"
                        iconBgColor="bg-purple-100"
                    />
                </div>

                {/* Invoice Aging Cards */}
                <div>
                    <h3 className="text-lg font-semibold mb-4">Invoice Aging</h3>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                        {invoiceAging.map((aging: any) => (
                            <Card key={aging.range} className="hover:shadow-md transition-shadow">
                                <CardContent className="pt-6">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-sm text-gray-500">{aging.range}</p>
                                            <p className="text-xl font-bold mt-1">
                                                {formatCurrency(aging.amount)}
                                            </p>
                                            <p className="text-sm text-gray-400 mt-1">
                                                {formatNumber(aging.count)} invoices
                                            </p>
                                        </div>
                                        <AlertTriangle
                                            className={`h-6 w-6 ${aging.range.includes("90")
                                                ? "text-red-500"
                                                : aging.range.includes("60")
                                                    ? "text-orange-500"
                                                    : "text-green-500"
                                                }`}
                                        />
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </div>

                {/* Collections vs Invoicing Trend */}
                <ChartCard
                    title="Collections vs Invoicing"
                    subtitle="Monthly comparison for selected period"
                >
                    <LineChart
                        labels={monthlyCollections.map((m: any) => m.month)}
                        datasets={[
                            {
                                label: "Collected",
                                data: monthlyCollections.map((m: any) => m.collected),
                                borderColor: "#10b981",
                                fill: true,
                            },
                            {
                                label: "Invoiced",
                                data: monthlyCollections.map((m: any) => m.invoiced),
                                borderColor: "#3b82f6",
                                fill: false,
                            },
                        ]}
                        showArea
                    />
                </ChartCard>

                {/* Payment Status & Payment Modes */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <ChartCard title="Payment Status" subtitle="Invoice distribution">
                        <DoughnutChart
                            labels={paymentStatusDistribution.map((p: any) => p.status)}
                            data={paymentStatusDistribution.map((p: any) => p.count)}
                            colors={paymentStatusDistribution.map(
                                (p: any) => statusColors[p.status] || "#6b7280"
                            )}
                        />
                    </ChartCard>

                    <ChartCard title="Payment Modes" subtitle="Collected by method">
                        <BarChart
                            labels={paymentModes.map((m: any) => `${m.mode} / ${m.subMode}`)}
                            datasets={[
                                {
                                    label: "Amount",
                                    data: paymentModes.map((m: any) => m.amount),
                                    backgroundColor: "#8b5cf6",
                                },
                            ]}
                            horizontal
                        />
                    </ChartCard>
                </div>

                {/* Bank Collections */}
                {bankCollections && bankCollections.length > 0 && (
                    <ChartCard title="Bank Collections" subtitle="By receiving bank">
                        <BarChart
                            labels={bankCollections.map((b: any) => b.bank)}
                            datasets={[
                                {
                                    label: "Amount",
                                    data: bankCollections.map((b: any) => b.amount),
                                    backgroundColor: "#06b6d4",
                                },
                            ]}
                        />
                    </ChartCard>
                )}

                {/* Top Debtors + Recent Receipts */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <ChartCard title="Top Debtors" subtitle="Highest outstanding balances">
                        <DataTable
                            columns={[
                                { key: "name", header: "Customer" },
                                { key: "code", header: "Code" },
                                {
                                    key: "totalDue",
                                    header: "Amount Due",
                                    render: (row: any) => formatCurrency(row.totalDue),
                                },
                                {
                                    key: "invoiceCount",
                                    header: "Invoices",
                                    render: (row: any) => formatNumber(row.invoiceCount),
                                },
                            ]}
                            data={topDebtors}
                        />
                    </ChartCard>

                    <ChartCard title="Recent Receipts" subtitle="Latest 10 payments">
                        <DataTable
                            columns={[
                                { key: "voucherNo", header: "Voucher" },
                                { key: "customer", header: "Customer" },
                                {
                                    key: "amount",
                                    header: "Amount",
                                    render: (row: any) => formatCurrency(row.amount),
                                },
                                {
                                    key: "mode",
                                    header: "Mode",
                                    render: (row: any) => `${row.mode} / ${row.subMode}`,
                                },
                                {
                                    key: "status",
                                    header: "Status",
                                    render: (row: any) => <Badge status={row.status} />,
                                },
                                {
                                    key: "date",
                                    header: "Date",
                                    render: (row: any) =>
                                        new Date(row.date).toLocaleDateString(),
                                },
                            ]}
                            data={recentReceipts}
                        />
                    </ChartCard>
                </div>
            </div>
        </div>
    );
}