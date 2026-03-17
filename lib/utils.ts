export function cn(...classes: (string | undefined | null | false)[]) {
    return classes.filter(Boolean).join(" ");
}

export function formatCurrency(value: number) {
    if (typeof value !== "number") return value;
    return new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        maximumFractionDigits: 0,
    }).format(value);
}

export function formatNumber(value: number) {
    if (typeof value !== "number") return value;
    return new Intl.NumberFormat("en-IN").format(value);
}

export function formatPercentage(value: number) {
    if (typeof value !== "number") return value;
    return `${value.toFixed(1)}%`;
}
