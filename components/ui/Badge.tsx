import { cn } from "@/lib/utils";
import { STATUS_COLORS } from "@/lib/constants";

interface BadgeProps {
    status: string;
    className?: string;
}

export function Badge({ status, className }: BadgeProps) {
    const colorClass =
        STATUS_COLORS[status as keyof typeof STATUS_COLORS] ||
        "bg-gray-100 text-gray-800";

    return (
        <span
            className={cn(
                "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium",
                colorClass,
                className
            )}
        >
            {status}
        </span>
    );
}