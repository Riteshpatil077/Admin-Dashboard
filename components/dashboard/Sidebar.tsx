"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
    LayoutDashboard,
    BarChart3,
    Wallet,
    Building2,
    Users,
    ShoppingCart,
    Package,
    FileText,
    Settings,
    LogOut,
} from "lucide-react";

const menuItems = [
    { name: "Overview", path: "/dashboard", icon: LayoutDashboard },
    { name: "Analytics", path: "/dashboard/analytics", icon: BarChart3 },
    { name: "Financial", path: "/dashboard/financial", icon: Wallet },
    { name: "Companies", path: "/dashboard/company", icon: Building2 },
    { type: "divider" },
    { name: "Customers", path: "/dashboard/customers", icon: Users },
    { name: "Orders", path: "/dashboard/orders", icon: ShoppingCart },
    { name: "Products", path: "/dashboard/products", icon: Package },
    { name: "Invoices", path: "/dashboard/invoices", icon: FileText },
    { type: "divider" },
    { name: "Settings", path: "/dashboard/settings", icon: Settings },
];

export function Sidebar() {
    const pathname = usePathname();

    return (
        <aside className="fixed left-0 top-0 h-full w-64 bg-gray-900 text-white flex flex-col">
            {/* Logo */}
            <div className="p-6 border-b border-gray-800">
                <h1 className="text-xl font-bold">ERP Dashboard</h1>
                <p className="text-sm text-gray-400 mt-1">Admin Panel</p>
            </div>

            {/* Navigation */}
            <nav className="flex-1 p-4 overflow-y-auto">
                <ul className="space-y-1">
                    {menuItems.map((item, index) => {
                        if (item.type === "divider") {
                            return (
                                <li key={index} className="my-4 border-t border-gray-800" />
                            );
                        }

                        const Icon = item.icon!;
                        const isActive = pathname === item.path;

                        return (
                            <li key={item.path}>
                                <Link
                                    href={item.path!}
                                    className={cn(
                                        "flex items-center gap-3 px-4 py-3 rounded-lg transition-colors",
                                        isActive
                                            ? "bg-blue-600 text-white"
                                            : "text-gray-400 hover:bg-gray-800 hover:text-white"
                                    )}
                                >
                                    <Icon className="h-5 w-5" />
                                    <span>{item.name}</span>
                                </Link>
                            </li>
                        );
                    })}
                </ul>
            </nav>

            {/* User Section */}
            <div className="p-4 border-t border-gray-800">
                <div className="flex items-center gap-3 px-4 py-3">
                    <div className="h-10 w-10 rounded-full bg-blue-600 flex items-center justify-center">
                        <span className="text-sm font-medium">AD</span>
                    </div>
                    <div className="flex-1">
                        <p className="text-sm font-medium">Admin User</p>
                        <p className="text-xs text-gray-400">admin@erp.com</p>
                    </div>
                    <button className="p-2 hover:bg-gray-800 rounded-lg">
                        <LogOut className="h-5 w-5 text-gray-400" />
                    </button>
                </div>
            </div>
        </aside>
    );
}