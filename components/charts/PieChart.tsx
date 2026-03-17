"use client";

import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js";
import { Pie } from "react-chartjs-2";
import { CHART_COLORS } from "@/lib/constants";

ChartJS.register(ArcElement, Tooltip, Legend);

interface PieChartProps {
    labels: string[];
    data: number[];
    colors?: string[];
}

export function PieChart({ labels, data, colors }: PieChartProps) {
    const defaultColors = Object.values(CHART_COLORS);

    const chartData = {
        labels,
        datasets: [
            {
                data,
                backgroundColor: colors || defaultColors.slice(0, labels.length),
                borderWidth: 2,
                borderColor: "#fff",
            },
        ],
    };

    const options = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: "bottom" as const,
                labels: {
                    usePointStyle: true,
                    padding: 15,
                },
            },
        },
    };

    return (
        <div className="h-64">
            <Pie data={chartData} options={options} />
        </div>
    );
}