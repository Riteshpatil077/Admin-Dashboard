"use client";

import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    Filler,
} from "chart.js";
import { Line } from "react-chartjs-2";
import { CHART_COLORS } from "@/lib/constants";

ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    Filler
);

interface LineChartProps {
    labels: string[];
    datasets: {
        label: string;
        data: number[];
        borderColor?: string;
        fill?: boolean;
    }[];
    showArea?: boolean;
}

export function LineChart({
    labels,
    datasets,
    showArea = false,
}: LineChartProps) {
    const colors = Object.values(CHART_COLORS);

    const data = {
        labels,
        datasets: datasets.map((ds, index) => ({
            ...ds,
            borderColor: ds.borderColor || colors[index % colors.length],
            backgroundColor: showArea
                ? `${colors[index % colors.length]}20`
                : "transparent",
            fill: showArea,
            tension: 0.4,
            pointRadius: 4,
            pointHoverRadius: 6,
        })),
    };

    const options = {
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
                grid: {
                    display: false,
                },
            },
            y: {
                grid: {
                    color: "#f3f4f6",
                },
            },
        },
    };

    return (
        <div className="h-80">
            <Line data={data} options={options} />
        </div>
    );
}