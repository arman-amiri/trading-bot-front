"use client";

import { useEffect, useRef } from "react";
import {
  createChart,
  CandlestickData,
  IChartApi,
  UTCTimestamp,
  LineStyle,
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
  type: "V" | "N";
  startIndex: number;
  endIndex: number;
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
      height: 600,
      layout: { background: { color: "#1e1e1e" }, textColor: "#ffffff" },
      grid: {
        vertLines: { color: "#2f2f2f" },
        horzLines: { color: "#2f2f2f" },
      },
      timeScale: { timeVisible: true },
    });

    chartRef.current = chart;

    const series = chart.addCandlestickSeries({
      upColor: "#4ade80",
      downColor: "#f87171",
      wickUpColor: "#4ade80",
      wickDownColor: "#f87171",
      borderVisible: false,
    });

    const fetchData = async () => {
      const [candlesRes, patternsRes] = await Promise.all([
        fetch(
          "http://localhost:5000/kucoin/candles?symbol=BTC-USDT&interval=15min&limit=300"
        ),
        fetch("http://localhost:5000/ichimoku?fractalDepth=0"),
      ]);

      const candlesJson: Candle[] = await candlesRes.json();
      const patterns: DetectedPattern[] = await patternsRes.json();

      const sortedCandles = candlesJson
        .sort((a, b) => a.timestamp - b.timestamp)
        .filter((c, i, arr) => i === 0 || c.timestamp !== arr[i - 1].timestamp);

      const data: CandlestickData[] = sortedCandles.map((c) => ({
        time: c.timestamp as UTCTimestamp,
        open: c.open,
        high: c.high,
        low: c.low,
        close: c.close,
      }));

      series.setData(data);

      for (const pattern of patterns) {
        const candles = pattern.candles;
        if (candles.length < 3) continue;

        const start = candles[0];
        // const mid = candles[Math.floor(candles.length / 2)];
        const end = candles[candles.length - 1];

        let middlePoint: Candle;

        if (pattern.type === "V") {
          middlePoint = candles.reduce((min, c) => (c.low < min.low ? c : min));
        } else if (pattern.type === "N") {
          middlePoint = candles.reduce((max, c) =>
            c.high > max.high ? c : max
          );
        } else {
          continue;
        }

        const leg1 = chart.addLineSeries({
          color: "yellow",
          lineWidth: 2,
          lineStyle: LineStyle.Solid,
        });

        leg1.setData([
          {
            time: start.timestamp as UTCTimestamp,
            value: pattern.type === "V" ? start.low : start.high,
          },
          {
            time: middlePoint.timestamp as UTCTimestamp,
            value: pattern.type === "V" ? middlePoint.low : middlePoint.high,
          },
        ]);

        const leg2 = chart.addLineSeries({
          color: "yellow",
          lineWidth: 2,
          lineStyle: LineStyle.Solid,
        });

        leg2.setData([
          {
            time: middlePoint.timestamp as UTCTimestamp,
            value: pattern.type === "V" ? middlePoint.low : middlePoint.high,
          },
          {
            time: end.timestamp as UTCTimestamp,
            value: pattern.type === "V" ? end.low : end.high,
          },
        ]);
      }
    };

    fetchData();

    window.addEventListener("resize", () => {
      chart.applyOptions({ width: containerRef.current!.clientWidth });
    });

    return () => chart.remove();
  }, []);

  return (
    <div className="w-full bg-gray-900 p-4 rounded-xl shadow-xl mt-10">
      <h2 className="text-white text-xl font-bold mb-2">نمودار BTC/USDT</h2>
      <div ref={containerRef} className="w-full min-h-[700px] h-[600px]" />
    </div>
  );
}
