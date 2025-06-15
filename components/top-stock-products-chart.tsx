"use client"

import { Bar } from "react-chartjs-2"
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from "chart.js"

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend)

export function TopStockProductsChart({ data }: { data: { name: string; value: number }[] }) {
  const chartData = {
    labels: data.map((d) => d.name),
datasets: [
  {
    label: "Quantité en stock",
    data: data.map((d) => d.value),
    backgroundColor: [
      "#3b82f6", // Bleu
      "#10b981", // Vert
      "#f59e0b", // Orange
      "#ef4444", // Rouge
      "#8b5cf6", // Violet
    ],
    borderRadius: 6,
  },
],

  }

  return <Bar data={chartData} options={{ responsive: true }} />
}
