import { cn, formatCurrency, formatNumber } from "@/lib/utils";
import { TrendingUp, TrendingDown, LucideIcon } from "lucide-react";

interface StatCardProps {
    title: string;
    value: number | string;
    icon: LucideIcon;
    trend?: {
        value: number;
        isPositive: boolean;
    };
    format?: "number" | "currency" | "none";
    className?: string;
    iconColor?: string;
    iconBgColor?: string;
}

export function StatCard({
    title,
    value,
    icon: Icon,
    trend,
    format = "number",
    className,
    iconColor = "text-blue-600",
    iconBgColor = "bg-blue-100",
}: StatCardProps) {
    const formattedValue =
        format === "currency"
            ? formatCurrency(value as number)
            : format === "number"
                ? formatNumber(value as number)
                : value;

    return (
        <div
            className={cn(
                "bg-white rounded-xl shadow-sm border border-gray-100 p-6",
                className
            )}
        >
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-sm font-medium text-gray-500">{title}</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">
                        {formattedValue}
                    </p>
                    {trend && (
                        <div className="flex items-center mt-2">
                            {trend.isPositive ? (
                                <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
                            ) : (
                                <TrendingDown className="h-4 w-4 text-red-500 mr-1" />
                            )}
                            <span
                                className={cn(
                                    "text-sm font-medium",
                                    trend.isPositive ? "text-green-600" : "text-red-600"
                                )}
                            >
                                {trend.value.toFixed(1)}%
                            </span>
                            <span className="text-sm text-gray-400 ml-1">vs last month</span>
                        </div>
                    )}
                </div>
                <div className={cn("p-3 rounded-xl", iconBgColor)}>
                    <Icon className={cn("h-6 w-6", iconColor)} />
                </div>
            </div>
        </div>
    );
}