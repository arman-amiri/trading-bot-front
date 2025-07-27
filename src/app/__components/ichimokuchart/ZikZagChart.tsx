"use client";

import { useEffect, useRef } from "react";
import {
  createChart,
  CandlestickData,
  IChartApi,
  UTCTimestamp,
  LineStyle,
  LineData,
} from "lightweight-charts";

type Candle = {
  timestamp: number;
  open: number;
  close: number;
  high: number;
  low: number;
  volume?: number;
};

type ZigZagPoint = {
  time: number;
  price: number;
  type: "peak" | "valley";
};

export default function ZikZagChart() {
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
        secondsVisible: false,
      },
      crosshair: {
        mode: 0,
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
        const [candlesRes, zigzagRes] = await Promise.all([
          fetch(
            "http://localhost:5000/kucoin/candles?symbol=BTC-USDT&interval=15min&limit=1000"
          ),
          fetch("http://localhost:5000/ichimoku/zikzag"),
        ]);

        const candlesJson: Candle[] = await candlesRes.json();
        const zigzagPoints: ZigZagPoint[] = await zigzagRes.json();

        const sortedCandles = candlesJson
          .sort((a, b) => a.timestamp - b.timestamp)
          .filter(
            (c, i, arr) => i === 0 || c.timestamp !== arr[i - 1].timestamp
          );

        const candleData: CandlestickData[] = sortedCandles.map((c) => ({
          time: c.timestamp as UTCTimestamp,
          open: c.open,
          high: c.high,
          low: c.low,
          close: c.close,
        }));

        candleSeries.setData(candleData);

        if (zigzagPoints.length > 1) {
          const zigzagSeries = chart.addLineSeries({
            color: "#facc15", // yellow-400
            lineWidth: 2,
            lineStyle: LineStyle.Solid,
            crossHairMarkerVisible: false,
            priceLineVisible: false,
          });

          const zigzagLineData: LineData[] = zigzagPoints.map((point) => ({
            time: point.time as UTCTimestamp,
            value: point.price,
          }));

          zigzagSeries.setData(zigzagLineData);
        }
      } catch (error) {
        console.error("خطا در واکشی یا پردازش داده‌ها:", error);
      }
    };

    fetchData();

    const resizeHandler = () => {
      chart.applyOptions({
        width: containerRef.current!.clientWidth,
      });
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
        نمودار BTC/USDT + ZigZag
      </h2>
      <div ref={containerRef} className="w-full min-h-[600px] h-[600px]" />
    </div>
  );
}
