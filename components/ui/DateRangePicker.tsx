"use client";

import { useState } from "react";
import { format, subDays, startOfMonth, endOfMonth, subMonths } from "date-fns";
import { Calendar, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface DateRangePickerProps {
    startDate: Date;
    endDate: Date;
    onChange: (start: Date, end: Date) => void;
    className?: string;
}

const PRESETS = [
    { label: "Today", getValue: () => [new Date(), new Date()] },
    { label: "Last 7 Days", getValue: () => [subDays(new Date(), 7), new Date()] },
    { label: "Last 30 Days", getValue: () => [subDays(new Date(), 30), new Date()] },
    { label: "This Month", getValue: () => [startOfMonth(new Date()), endOfMonth(new Date())] },
    { label: "Last Month", getValue: () => [startOfMonth(subMonths(new Date(), 1)), endOfMonth(subMonths(new Date(), 1))] },
];

export function DateRangePicker({
    startDate,
    endDate,
    onChange,
    className,
}: DateRangePickerProps) {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <div className={cn("relative", className)}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-2 bg-white border border-gray-300 rounded-lg px-4 py-2 text-sm hover:bg-gray-50"
            >
                <Calendar className="h-4 w-4 text-gray-400" />
                <span>
                    {format(startDate, "MMM dd, yyyy")} - {format(endDate, "MMM dd, yyyy")}
                </span>
                <ChevronDown className="h-4 w-4 text-gray-400" />
            </button>

            {isOpen && (
                <div className="absolute right-0 mt-2 w-64 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
                    <div className="p-2">
                        {PRESETS.map((preset) => (
                            <button
                                key={preset.label}
                                onClick={() => {
                                    const [start, end] = preset.getValue();
                                    onChange(start, end);
                                    setIsOpen(false);
                                }}
                                className="w-full text-left px-3 py-2 text-sm rounded-md hover:bg-gray-100"
                            >
                                {preset.label}
                            </button>
                        ))}
                    </div>
                    <div className="border-t p-3">
                        <div className="grid grid-cols-2 gap-2">
                            <input
                                type="date"
                                value={format(startDate, "yyyy-MM-dd")}
                                onChange={(e) => onChange(new Date(e.target.value), endDate)}
                                className="px-2 py-1 text-sm border rounded"
                            />
                            <input
                                type="date"
                                value={format(endDate, "yyyy-MM-dd")}
                                onChange={(e) => onChange(startDate, new Date(e.target.value))}
                                className="px-2 py-1 text-sm border rounded"
                            />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}