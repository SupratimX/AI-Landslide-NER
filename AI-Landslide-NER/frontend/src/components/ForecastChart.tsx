"use client";

import { useEffect, useRef } from "react";
import {
  Chart,
  LineController,
  LineElement,
  PointElement,
  LinearScale,
  CategoryScale,
  Filler,
  Tooltip,
} from "chart.js";

Chart.register(
  LineController,
  LineElement,
  PointElement,
  LinearScale,
  CategoryScale,
  Filler,
  Tooltip
);

interface Props {
  baseScore: number;
}

export default function ForecastChart({ baseScore }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const chartRef = useRef<Chart | null>(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    // Generate a simple forecast curve around the current score
    const scores = [
      baseScore,
      Math.min(99, baseScore + 3),
      Math.min(99, baseScore + 6),
      Math.min(99, baseScore + 2),
      Math.max(10, baseScore - 3),
      Math.max(10, baseScore - 10),
      Math.max(10, baseScore - 17),
    ];

    if (chartRef.current) {
      chartRef.current.destroy();
    }

    const color =
      baseScore >= 80
        ? "#ff3b3b"
        : baseScore >= 70
        ? "#ff8c00"
        : baseScore >= 50
        ? "#f5c400"
        : "#2ecc71";

    chartRef.current = new Chart(canvasRef.current, {
      type: "line",
      data: {
        labels: ["Now", "3h", "6h", "9h", "12h", "18h", "24h"],
        datasets: [
          {
            data: scores,
            borderColor: color,
            backgroundColor: color + "1a",
            borderWidth: 2,
            fill: true,
            tension: 0.4,
            pointRadius: 3,
            pointBackgroundColor: color,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          x: {
            ticks: { color: "#5a7a9a", font: { size: 10 } },
            grid: { color: "#1e2d3d" },
          },
          y: {
            min: 0,
            max: 100,
            ticks: { color: "#5a7a9a", font: { size: 10 } },
            grid: { color: "#1e2d3d" },
          },
        },
      },
    });

    return () => {
      chartRef.current?.destroy();
    };
  }, [baseScore]);

  return (
    <div className="bg-card border border-border rounded-lg p-3">
      <div className="relative h-[120px]">
        <canvas ref={canvasRef} />
      </div>
    </div>
  );
}
