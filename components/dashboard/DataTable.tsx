/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { cn } from "@/lib/utils";

interface Column<T> {
    key: keyof T | string;
    header: string;
    render?: (row: T) => React.ReactNode;
    className?: string;
}

interface DataTableProps<T> {
    columns: Column<T>[];
    data: T[];
    className?: string;
}

export function DataTable<T extends Record<string, any>>({
    columns,
    data,
    className,
}: DataTableProps<T>) {
    return (
        <div className={cn("overflow-x-auto", className)}>
            <table className="w-full">
                <thead>
                    <tr className="border-b border-gray-200">
                        {columns.map((col) => (
                            <th
                                key={col.key as string}
                                className="text-left py-3 px-4 text-sm font-medium text-gray-500"
                            >
                                {col.header}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {data.map((row, index) => (
                        <tr
                            key={index}
                            className="border-b border-gray-100 hover:bg-gray-50"
                        >
                            {columns.map((col) => (
                                <td
                                    key={col.key as string}
                                    className={cn("py-3 px-4 text-sm", col.className)}
                                >
                                    {col.render
                                        ? col.render(row)
                                        : row[col.key as keyof T]?.toString()}
                                </td>
                            ))}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}