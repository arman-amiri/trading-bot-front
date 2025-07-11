"use client";

import { useEffect, useRef } from "react";
import {
  createChart,
  IChartApi,
  UTCTimestamp,
  CandlestickData,
  SeriesMarker,
} from "lightweight-charts";

type Candle = {
  timestamp: number;
  open: number;
  close: number;
  high: number;
  low: number;
  volume?: number;
};

type DetectedPattern = {
  type: "V" | "I" | "N";
  index: number;
  candles: Candle[];
  fractalLevel: number;
};

export default function CandlestickChart() {
  const chartRef = useRef<IChartApi | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const chart = createChart(containerRef.current, {
      width: containerRef.current.clientWidth,
      height: 500,
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
        secondsVisible: false,
      },
    });

    chartRef.current = chart;

    const series = chart.addCandlestickSeries({
      upColor: "#4ade80",
      downColor: "#f87171",
      borderVisible: false,
      wickUpColor: "#4ade80",
      wickDownColor: "#f87171",
    });

    const fetchData = async () => {
      try {
        const [candlesRes, patternsRes] = await Promise.all([
          fetch(
            "http://localhost:5000/kucoin/candles?symbol=BTC-USDT&interval=15min&limit=50"
          ),
          fetch("http://localhost:5000/ichimoku?fractalDepth=2"),
        ]);

        const candlesJson = await candlesRes.json();
        const patternsJson = await patternsRes.json();

        if (!Array.isArray(candlesJson)) {
          console.error("candles is not an array:", candlesJson);
          return;
        }

        // مرتب‌سازی و حذف داده‌های با timestamp تکراری
        const seenTimestamps = new Set<number>();

        const cleanedCandles: Candle[] = [...candlesJson]
          .sort((a, b) => a.timestamp - b.timestamp)
          .filter((c) => {
            const ts = Math.floor(c.timestamp / 1000);
            if (seenTimestamps.has(ts)) return false;
            seenTimestamps.add(ts);
            return true;
          });

        console.log(
          cleanedCandles.map((c) => ({
            time: Math.floor(c.timestamp / 1000),
            raw: c.timestamp,
          })),
          "fff"
        );

        const data: CandlestickData[] = cleanedCandles.map((c) => ({
          // time: Math.floor(c.timestamp / 1000) as UTCTimestamp,
          time: c.timestamp as UTCTimestamp,
          open: c.open,
          high: c.high,
          low: c.low,
          close: c.close,
        }));

        series.setData(data);

        const patterns: DetectedPattern[] = Array.isArray(patternsJson)
          ? patternsJson
          : [];

        const markers: SeriesMarker<UTCTimestamp>[] = patterns
          .filter((p) => p.index >= 0 && p.index < cleanedCandles.length)
          .map((p) => {
            const candle = cleanedCandles[p.index];
            return {
              time: Math.floor(candle.timestamp / 1000) as UTCTimestamp,
              position: "aboveBar",
              color:
                p.type === "V" ? "red" : p.type === "I" ? "blue" : "orange",
              shape: "arrowDown",
              text: p.type,
            };
          });

        // مرتب‌سازی markers
        const sortedMarkers = markers.sort((a, b) => a.time - b.time);
        series.setMarkers(sortedMarkers);
      } catch (error) {
        console.error("خطا در دریافت داده:", error);
      }
    };

    fetchData();

    const handleResize = () => {
      chart.applyOptions({
        width: containerRef.current!.clientWidth,
      });
    };

    window.addEventListener("resize", handleResize);

    return () => {
      chart.remove();
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  return (
    <div className="w-full bg-gray-900 p-4 rounded-xl shadow-xl mt-10">
      <h2 className="text-white text-xl font-bold mb-2">نمودار BTC/USDT</h2>
      <div ref={containerRef} className="w-full min-h-[700px] h-[500px]" />
    </div>
  );
}
