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

export default function ABCD() {
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
          fetch("http://localhost:5000/ichimoku/abcde-a-top-2-1"),
        ]);

        const candlesJson: Candle[] = await candlesRes.json();

        // اینجا جواب رو به صورت رشته یا شیء بررسی می‌کنیم که pattern وجود داره یا نه
        const adPointsData = await adPointsRes.json();
        console.log(adPointsData, "adPointsData");

        // اگر جواب «Pattern not found» بود یا یکی از نقاط موجود نبود، فقط کندل‌ها را نمایش بده و مارکر و خط نذار
        if (!adPointsData || adPointsData.message === "Pattern not found") {
          console.warn("❗ نقاط A, B, C یا D موجود نیستند یا الگو یافت نشد");

          // فقط کندل‌ها را ست کن
          const candleData: CandlestickData[] = candlesJson.map((c) => ({
            time: Math.floor(c.timestamp / 100) as UTCTimestamp,
            open: c.open,
            high: c.high,
            low: c.low,
            close: c.close,
          }));
          console.log(candleData, "candleData");
          candleSeries.setData(candleData);

          // اگه قبلاً خطوط یا مارکری اضافه شده بودن حذف‌شون کن
          // چون اینجا تازه chart ساختیم و فقط یک candleSeries داریم و هنوز خطوط اضافه نکردیم
          // پس کاری لازم نیست انجام بدیم

          return;
        }

        // اگر همه نقاط وجود داشتند، ادامه بده
        const { A, B, C, D } = adPointsData;

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

        const Atime = Math.floor(A.timestamp / 1000) as UTCTimestamp;
        const Btime = Math.floor(B.timestamp / 1000) as UTCTimestamp;
        const Ctime = Math.floor(C.timestamp / 1000) as UTCTimestamp;
        const Dtime = Math.floor(D.timestamp / 1000) as UTCTimestamp;

        // اضافه کردن Markers برای نقاط A, B, C, D
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

        // رسم خطوط اتصال A → B → C → D
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
        نمودار BTC/USDT + نقاط A, B, C, D و خطوط اتصال
      </h2>
      <div ref={containerRef} className="w-full min-h-[600px] h-[600px]" />
    </div>
  );
}
