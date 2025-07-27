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
  high: number;
  low: number;
  close: number;
  volume: number;
};

export default function AD() {
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
        const [candlesRes, adPointsRes] = await Promise.all([
          fetch("http://localhost:5000/kucoin/candles"),
          fetch("http://localhost:5000/ichimoku/pattern-78"),
        ]);

        const candlesJson: Candle[] = await candlesRes.json();
        const adPoints = await adPointsRes.json();

        if (!adPoints.A || !adPoints.D) {
          console.warn("❗ نقاط A یا D در پاسخ API وجود ندارند:", adPoints);
          return;
        }

        const { A, D }: { A: Candle; D: Candle } = adPoints;

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

        const Dtime = Math.floor(D.timestamp / 1000) as UTCTimestamp;
        const Atime = Math.floor(A.timestamp / 1000) as UTCTimestamp;

        const markers: SeriesMarker<UTCTimestamp>[] = [
          {
            time: Dtime,
            position: "belowBar",
            color: "#38bdf8",
            shape: "circle",
            text: "D",
          },
          {
            time: Atime,
            position: "aboveBar",
            color: "#f87171",
            shape: "circle",
            text: "A",
          },
        ];

        candleSeries.setMarkers(markers);
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
        نمودار BTC/USDT + نقاط A و D
      </h2>
      <div ref={containerRef} className="w-full min-h-[600px] h-[600px]" />
    </div>
  );
}
