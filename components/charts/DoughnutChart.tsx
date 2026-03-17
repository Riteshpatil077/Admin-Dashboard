"use client";

import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js";
import { Doughnut } from "react-chartjs-2";
import { CHART_COLORS } from "@/lib/constants";

ChartJS.register(ArcElement, Tooltip, Legend);

interface DoughnutChartProps {
    labels: string[];
    data: number[];
    colors?: string[];
}

export function DoughnutChart({ labels, data, colors }: DoughnutChartProps) {
    const defaultColors = Object.values(CHART_COLORS);

    const chartData = {
        labels,
        datasets: [
            {
                data,
                backgroundColor: colors || defaultColors.slice(0, labels.length),
                borderWidth: 0,
                cutout: "70%",
            },
        ],
    };

    const options = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: "right" as const,
                labels: {
                    usePointStyle: true,
                    padding: 20,
                },
            },
        },
    };

    return (
        <div className="h-64">
            <Doughnut data={chartData} options={options} />
        </div>
    );
}