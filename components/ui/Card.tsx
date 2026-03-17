import { cn } from "@/lib/utils";
import { ReactNode } from "react";

interface CardProps {
    children: ReactNode;
    className?: string;
}

export function Card({ children, className }: CardProps) {
    return (
        <div
            className={cn(
                "bg-white rounded-xl shadow-sm border border-gray-100 p-6",
                className
            )}
        >
            {children}
        </div>
    );
}

export function CardHeader({
    children,
    className,
}: {
    children: ReactNode;
    className?: string;
}) {
    return (
        <div className={cn("flex items-center justify-between mb-4", className)}>
            {children}
        </div>
    );
}

export function CardTitle({
    children,
    className,
}: {
    children: ReactNode;
    className?: string;
}) {
    return (
        <h3 className={cn("text-lg font-semibold text-gray-900", className)}>
            {children}
        </h3>
    );
}

export function CardContent({
    children,
    className,
}: {
    children: ReactNode;
    className?: string;
}) {
    return <div className={cn("", className)}>{children}</div>;
}