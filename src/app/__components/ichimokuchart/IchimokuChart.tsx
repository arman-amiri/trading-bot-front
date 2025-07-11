"use client";

import { useEffect, useState } from "react";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  LineElement,
  PointElement,
  LinearScale,
  CategoryScale,
  Tooltip,
  Legend,
  ChartOptions,
} from "chart.js";

ChartJS.register(
  LineElement,
  PointElement,
  LinearScale,
  CategoryScale,
  Tooltip,
  Legend
);

interface Candle {
  open: number;
  close: number;
  high: number;
  low: number;
  volume?: number;
}

interface DetectedPattern {
  type: "V" | "I" | "N";
  index: number;
  candles: Candle[];
  fractalLevel: number;
}

export default function IchimokuChart() {
  const [candles, setCandles] = useState<Candle[]>([]);
  const [patterns, setPatterns] = useState<DetectedPattern[]>([]);

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch(
          "http://localhost:5000/ichimoku?fractalDepth=2"
        );
        const data: DetectedPattern[] = await res.json();

        const candlesRes = await fetch(
          "http://localhost:5000/kucoin/candles?symbol=BTC-USDT&interval=15min&limit=50"
        );
        const cData: Candle[] = await candlesRes.json();

        setCandles(cData);
        setPatterns(data);
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    }
    fetchData();
  }, []);

  const chartData = {
    labels: candles.map((_, i) => i.toString()),
    datasets: [
      {
        label: "Close Price",
        data: candles.map((c) => c.close),
        borderColor: "rgba(75,192,192,1)",
        borderWidth: 2,
        fill: false,
        tension: 0.1,
      },
      ...patterns.map((pattern) => ({
        label: `Pattern ${pattern.type} @${pattern.index}`,
        data: candles.map((_, idx) =>
          idx === pattern.index ? pattern.candles[1].close : null
        ),
        borderColor:
          pattern.type === "V"
            ? "red"
            : pattern.type === "I"
            ? "blue"
            : "orange",
        pointRadius: 5,
        showLine: false,
      })),
    ],
  };

  const chartOptions: ChartOptions<"line"> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        labels: {
          color: "white",
        },
      },
    },
    scales: {
      x: {
        ticks: {
          color: "white",
        },
        grid: {
          color: "#444",
        },
      },
      y: {
        ticks: {
          color: "white",
        },
        grid: {
          color: "#444",
        },
      },
    },
  };

  const chartBackgroundPlugin = {
    id: "customCanvasBackgroundColor",
    beforeDraw: (chart: any) => {
      const ctx = chart.canvas.getContext("2d");
      ctx.save();
      ctx.globalCompositeOperation = "destination-over";
      ctx.fillStyle = "#1e1e1e"; // رنگ بک‌گراند تیره
      ctx.fillRect(0, 0, chart.width, chart.height);
      ctx.restore();
    },
  };

  return (
    <div className="w-full mx-auto mt-10 p-4 bg-gray-900 rounded-xl shadow-md">
      <h2 className="text-2xl font-bold mb-4 text-white">
        Ichimoku Pattern Chart
      </h2>
      <div className="h-[500px]">
        <Line
          data={chartData}
          options={chartOptions}
          plugins={[chartBackgroundPlugin]}
        />
      </div>
    </div>
  );
}
