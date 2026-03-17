"use client";

import { Bell, Search } from "lucide-react";
import { DateRangePicker } from "@/components/ui/DateRangePicker";
import React, { useState } from "react";
import { subDays } from "date-fns";

interface HeaderProps {
    title: string;
    subtitle?: string;
    rightActions?: React.ReactNode;
    startDate?: Date;
    endDate?: Date;
    onDateChange?: (start: Date, end: Date) => void;
}

export function Header({ title, subtitle, rightActions, startDate: externalStart, endDate: externalEnd, onDateChange }: HeaderProps) {
    const [internalStart, setInternalStart] = useState(subDays(new Date(), 30));
    const [internalEnd, setInternalEnd] = useState(new Date());

    const startDate = externalStart || internalStart;
    const endDate = externalEnd || internalEnd;

    return (
        <header className="bg-white border-b border-gray-200 px-8 py-4">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
                    {subtitle && <p className="text-sm text-gray-500 mt-1">{subtitle}</p>}
                </div>

                <div className="flex items-center gap-4">
                    {/* Search */}
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search..."
                            className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-64"
                        />
                    </div>

                    {/* Date Range */}
                    <DateRangePicker
                        startDate={startDate}
                        endDate={endDate}
                        onChange={(start, end) => {
                            setInternalStart(start);
                            setInternalEnd(end);
                            if (onDateChange) {
                                onDateChange(start, end);
                            }
                        }}
                    />

                    {/* Notifications */}
                    <button className="relative p-2 hover:bg-gray-100 rounded-lg">
                        <Bell className="h-5 w-5 text-gray-600" />
                        <span className="absolute top-1 right-1 h-2 w-2 bg-red-500 rounded-full" />
                    </button>
                </div>
            </div>
        </header>
    );
}