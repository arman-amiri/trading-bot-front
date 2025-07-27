"use client";

import { useEffect, useRef } from "react";
import {
  createChart,
  CandlestickData,
  IChartApi,
  UTCTimestamp,
  LineStyle,
  LineData,
  SeriesMarker,
} from "lightweight-charts";

type Candle = {
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
};

type CyclePattern = {
  A: Candle;
  B: Candle;
  C: Candle;
  D: Candle;
  distanceAB: number;
  distanceBC: number;
  isValid: boolean;
};

export default function Cycle() {
  const chartRef = useRef<IChartApi | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const chart = createChart(containerRef.current, {
      width: containerRef.current.clientWidth,
      height: 600,
      layout: {
        background: { color: "#1e1e1e" },
        textColor: "#ffffff",
      },
      grid: {
        vertLines: { color: "#2f2f2f" },
        horzLines: { color: "#2f2f2f" },
      },
      timeScale: {
        timeVisible: true,
      },
    });

    chartRef.current = chart;

    const candleSeries = chart.addCandlestickSeries({
      upColor: "#4ade80",
      downColor: "#f87171",
      wickUpColor: "#4ade80",
      wickDownColor: "#f87171",
      borderVisible: false,
    });

    const fetchData = async () => {
      try {
        const [candlesRes, cyclesRes] = await Promise.all([
          fetch(
            "http://localhost:5000/kucoin/candles"
          ),
          fetch("http://localhost:5000/ichimoku/cycle-patterns"),
        ]);

        const candlesJson: Candle[] = await candlesRes.json();
        const cyclePatterns: CyclePattern[] = await cyclesRes.json();

        // حذف کندل‌هایی که timestamp برابر دارند (بعد از تبدیل به ثانیه)
        const uniqueTimeMap = new Map<UTCTimestamp, Candle>();
        candlesJson.forEach((c) => {
          const time = Math.floor(c.timestamp / 1000) as UTCTimestamp;
          if (!uniqueTimeMap.has(time)) {
            uniqueTimeMap.set(time, c);
          }
        });

        const sortedCandles = Array.from(uniqueTimeMap.values()).sort(
          (a, b) => a.timestamp - b.timestamp
        );

        const candleData: CandlestickData[] = sortedCandles.map((c) => ({
          time: Math.floor(c.timestamp / 1000) as UTCTimestamp,
          open: c.open,
          high: c.high,
          low: c.low,
          close: c.close,
        }));

        candleSeries.setData(candleData);

        // تبدیل کندل به داده خطی برای نمایش سری‌ها
        const convert = (candle: Candle): LineData => ({
          time: Math.floor(candle.timestamp / 1000) as UTCTimestamp,
          value: candle.close,
        });

        cyclePatterns.forEach((pattern, index) => {
          if (!pattern.isValid) return;

          const { A, B, C, D } = pattern;

          const color = ["#38bdf8", "#6366f1", "#f472b6", "#f97316"][index % 4];

          const series = chart.addLineSeries({
            color,
            lineWidth: 2,
            lineStyle: LineStyle.Solid,
            priceLineVisible: false,
            crossHairMarkerVisible: false,
            title: `Cycle ${index + 1}`,
          });

          const points: LineData[] = [
            convert(A),
            convert(B),
            convert(C),
            convert(D),
          ];
          series.setData(points);

          const markers: SeriesMarker<UTCTimestamp>[] = [
            {
              time: points[0].time,
              position: "aboveBar",
              color: "#38bdf8",
              shape: "circle",
              text: "A",
            },
            {
              time: points[1].time,
              position: "belowBar",
              color: "#6366f1",
              shape: "circle",
              text: "B",
            },
            {
              time: points[2].time,
              position: "aboveBar",
              color: "#f472b6",
              shape: "circle",
              text: "C",
            },
            {
              time: points[3].time,
              position: "belowBar",
              color: "#f97316",
              shape: "circle",
              text: "D",
            },
          ];

          series.setMarkers(markers);
        });
      } catch (error) {
        console.error("❌ خطا در دریافت یا پردازش داده‌ها:", error);
      }
    };

    fetchData();

    const resizeHandler = () => {
      if (containerRef.current) {
        chart.applyOptions({ width: containerRef.current.clientWidth });
      }
    };

    window.addEventListener("resize", resizeHandler);
    return () => {
      chart.remove();
      window.removeEventListener("resize", resizeHandler);
    };
  }, []);

  return (
    <div className="w-full bg-gray-900 p-4 rounded-xl shadow-xl mt-10">
      <h2 className="text-white text-xl font-bold mb-4">
        نمودار BTC/USDT + الگوهای چرخه‌ای
      </h2>
      <div ref={containerRef} className="w-full min-h-[600px] h-[600px]" />
    </div>
  );
}
