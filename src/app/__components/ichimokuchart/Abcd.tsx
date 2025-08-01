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

type Point = {
  timestamp: number;
  high: number;
  low: number;
};

type ABCDProps = {
  candles: Candle[];
  points?: {
    A?: Point;
    B?: Point;
    C?: Point;
    D?: Point;
  };
};

export default function ABCD({ candles, points }: ABCDProps) {
  const chartRef = useRef<IChartApi | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    if (chartRef.current) {
      chartRef.current.remove();
      chartRef.current = null;
    }

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

    // مرتب‌سازی و حذف تکراری‌های زمانی کندل‌ها
    const seenTimes = new Set<UTCTimestamp>();
    const cleanedCandles: Candle[] = [];

    candles.forEach((c) => {
      const time = Math.floor(c.timestamp / 1000) as UTCTimestamp;
      if (!seenTimes.has(time)) {
        seenTimes.add(time);
        cleanedCandles.push(c);
      }
    });

    const sortedCandles = cleanedCandles.sort(
      (a, b) => a.timestamp - b.timestamp
    );

    const candleData: CandlestickData[] = sortedCandles.map((c) => ({
      time: c.timestamp as UTCTimestamp,
      // time: Math.floor(c.timestamp / 1000) as UTCTimestamp,
      // const time = c.timestamp as UTCTimestamp;

      open: c.open,
      high: c.high,
      low: c.low,
      close: c.close,
    }));

    candleSeries.setData(candleData);

    // اگر نقاط داده شده موجود و کامل نیستند، مارکر و خطوط نذار
    if (!points || !points.A || !points.B || !points.C || !points.D) {
      return;
    }

    const { A, B, C, D } = points;

    const Atime = Math.floor(A.timestamp / 1000) as UTCTimestamp;
    const Btime = Math.floor(B.timestamp / 1000) as UTCTimestamp;
    const Ctime = Math.floor(C.timestamp / 1000) as UTCTimestamp;
    const Dtime = Math.floor(D.timestamp / 1000) as UTCTimestamp;

    const markers: SeriesMarker<UTCTimestamp>[] = [
      {
        time: Atime,
        position: "aboveBar",
        color: "#f59e0b",
        shape: "arrowDown",
        text: "A",
      },
      {
        time: Btime,
        position: "belowBar",
        color: "#10b981",
        shape: "arrowUp",
        text: "B",
      },
      {
        time: Ctime,
        position: "aboveBar",
        color: "#3b82f6",
        shape: "arrowDown",
        text: "C",
      },
      {
        time: Dtime,
        position: "belowBar",
        color: "#ef4444",
        shape: "arrowUp",
        text: "D",
      },
    ];

    candleSeries.setMarkers(markers);

    const pathSeries = chart.addLineSeries({
      color: "#facc15",
      lineWidth: 2,
      priceLineVisible: false,
      crossHairMarkerVisible: false,
    });

    pathSeries.setData([
      { time: Atime, value: A.high },
      { time: Btime, value: B.low },
      { time: Ctime, value: C.high },
      { time: Dtime, value: D.low },
    ]);

    // مدیریت تغییر سایز پنجره
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
  }, [candles, points]);

  return (
    <div className="w-full bg-gray-900 p-4 rounded-xl shadow-xl mt-10">
      <h2 className="text-white text-xl font-bold mb-4">
        نمودار BTC/USDT + نقاط A, B, C, D و خطوط اتصال
      </h2>
      <div ref={containerRef} className="w-auto h-full" />
      {/* min-h-[600px] h-[600px] */}
    </div>
  );
}
