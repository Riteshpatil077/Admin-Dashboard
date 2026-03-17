import { ReactNode } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { MoreHorizontal } from "lucide-react";

interface ChartCardProps {
    title: string;
    subtitle?: string;
    children: ReactNode;
    action?: ReactNode;
}

export function ChartCard({ title, subtitle, children, action }: ChartCardProps) {
    return (
        <Card>
            <CardHeader>
                <div>
                    <CardTitle>{title}</CardTitle>
                    {subtitle && (
                        <p className="text-sm text-gray-500 mt-1">{subtitle}</p>
                    )}
                </div>
                {action || (
                    <button className="p-2 hover:bg-gray-100 rounded-lg">
                        <MoreHorizontal className="h-5 w-5 text-gray-400" />
                    </button>
                )}
            </CardHeader>
            <CardContent>{children}</CardContent>
        </Card>
    );
}