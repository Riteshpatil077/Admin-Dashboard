"use client";

import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend,
} from "chart.js";
import { Bar } from "react-chartjs-2";
import { CHART_COLORS } from "@/lib/constants";

ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend
);

interface BarChartProps {
    labels: string[];
    datasets: {
        label: string;
        data: number[];
        backgroundColor?: string;
    }[];
    horizontal?: boolean;
    stacked?: boolean;
}

export function BarChart({
    labels,
    datasets,
    horizontal = false,
    stacked = false,
}: BarChartProps) {
    const colors = Object.values(CHART_COLORS);

    const data = {
        labels,
        datasets: datasets.map((ds, index) => ({
            ...ds,
            backgroundColor: ds.backgroundColor || colors[index % colors.length],
            borderRadius: 6,
        })),
    };

    const options = {
        indexAxis: horizontal ? ("y" as const) : ("x" as const),
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: "top" as const,
                labels: {
                    usePointStyle: true,
                    padding: 20,
                },
            },
        },
        scales: {
            x: {
                stacked,
                grid: {
                    display: false,
                },
            },
            y: {
                stacked,
                grid: {
                    color: "#f3f4f6",
                },
            },
        },
    };

    return (
        <div className="h-80">
            <Bar data={data} options={options} />
        </div>
    );
}