export const CHART_COLORS = {
    primary: "#3b82f6",
    secondary: "#10b981",
    warning: "#f59e0b",
    danger: "#ef4444",
    purple: "#8b5cf6",
    pink: "#ec4899",
    cyan: "#06b6d4",
    gray: "#6b7280",
};

export const STATUS_COLORS = {
    ACTIVE: "bg-green-100 text-green-800",
    INACTIVE: "bg-gray-100 text-gray-800",
    PENDING: "bg-yellow-100 text-yellow-800",
    CONFIRMED: "bg-blue-100 text-blue-800",
    CANCELLED: "bg-red-100 text-red-800",
    PAID: "bg-green-100 text-green-800",
    UNPAID: "bg-red-100 text-red-800",
    PARTIAL: "bg-orange-100 text-orange-800",
    CLEARED: "bg-green-100 text-green-800",
};

export const DASHBOARD_ROUTES = [
    { name: "Overview", path: "/dashboard", icon: "LayoutDashboard" },
    { name: "Analytics", path: "/dashboard/analytics", icon: "BarChart3" },
    { name: "Financial", path: "/dashboard/financial", icon: "Wallet" },
    { name: "Companies", path: "/dashboard/company", icon: "Building2" },
];