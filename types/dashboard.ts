export interface DashboardStats {
    totalCustomers: number;
    totalOrders: number;
    totalSubscriptions: number;
    totalRevenue: number;
    monthlyRevenue: number;
    pendingOrders: number;
    activeSubscriptions: number;
    totalProducts: number;
}

export interface ChartData {
    labels: string[];
    datasets: {
        label: string;
        data: number[];
        backgroundColor?: string | string[];
        borderColor?: string;
        fill?: boolean;
    }[];
}

export interface OrderTrend {
    month: string;
    orders: number;
    revenue: number;
}

export interface CustomerAnalytics {
    category: string;
    count: number;
    revenue: number;
}

export interface FinancialSummary {
    totalReceivables: number;
    totalReceived: number;
    pendingAmount: number;
    overdueAmount: number;
    advanceBalance: number;
}

export interface CompanyStats {
    id: number;
    name: string;
    totalOrders: number;
    totalRevenue: number;
    totalCustomers: number;
    activeUsers: number;
}

export interface TopProduct {
    id: number;
    name: string;
    category: string;
    totalSold: number;
    revenue: number;
}

export interface TopCustomer {
    id: number;
    name: string;
    code: string;
    totalOrders: number;
    totalRevenue: number;
    pendingAmount: number;
}

export interface InvoiceAging {
    range: string;
    count: number;
    amount: number;
}

export interface GSTSummary {
    cgst: number;
    sgst: number;
    igst: number;
    totalTax: number;
}