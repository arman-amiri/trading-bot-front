"use client";

import ABCD from "@/app/__components/ichimokuchart/Abcd";
import { useEffect, useState } from "react";

type Point = {
  timestamp: number;
  high: number;
  low: number;
};
type Candle = {
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
};

const AdPage = () => {
  const [candles15Min, setCandles15Min] = useState<Candle[]>([]);
  const [points, setPoints] = useState<
    { A?: Point; B?: Point; C?: Point; D?: Point } | undefined
  >(undefined);

  const [candles1Min, setCandles1Min] = useState<Candle[]>([]);
  const [points1Min, setPoints1Min] = useState<
    { A?: Point; B?: Point; C?: Point; D?: Point } | undefined
  >(undefined);

  // 1 min
  useEffect(() => {
    async function fetchData() {
      try {
        const [candlesRes, pointsRes] = await Promise.all([
          fetch("http://localhost:5000/kucoin/candles?interval=1min"),
          fetch(
            "http://localhost:5000/ichimoku/abcde-a-top-2-1?interval=1min"
          ),
        ]);

        const candlesJson = await candlesRes.json();
        const pointsJson = await pointsRes.json();

        if (!pointsJson || pointsJson.message === "Pattern not found") {
          setPoints1Min(undefined); // یا null
        } else {
          setPoints1Min(pointsJson);
        }

        setCandles1Min(candlesJson);
      } catch (error) {
        console.error(error);
      }
    }

    fetchData(); // اجرای فوری در ابتدا

    const intervalId = setInterval(() => {
      fetchData();
    }, 60 * 1000); // هر 1 دقیقه

    return () => clearInterval(intervalId); // تمیزکاری هنگام unmount
  }, []);

  // 15min
  useEffect(() => {
    async function fetchData() {
      try {
        const [candlesRes, pointsRes] = await Promise.all([
          fetch("http://localhost:5000/kucoin/candles?interval=15min"),
          fetch(
            "http://localhost:5000/ichimoku/abcde-a-top-2-1?interval=15min"
          ),
        ]);

        const candlesJson = await candlesRes.json();
        const pointsJson = await pointsRes.json();

        if (!pointsJson || pointsJson.message === "Pattern not found") {
          setPoints(undefined); // یا null
        } else {
          setPoints(pointsJson);
        }

        setCandles15Min(candlesJson);
      } catch (error) {
        console.error(error);
      }
    }

    fetchData(); // اجرای فوری در ابتدا

    const intervalId = setInterval(() => {
      fetchData();
    }, 15 * 60 * 1000); // هر 15 دقیقه

    return () => clearInterval(intervalId); // تمیزکاری هنگام unmount
  }, []);

  return (
    <div className="bg-black w-full flex  gap-5">
      <div className="bg-black w-1/2">
        <div className="text-3xl text-gray-300">15 min</div>
        <ABCD candles={candles15Min} points={points} />
      </div>

      <div className="bg-black w-1/2 text-gray-300">
        <div className="text-3xl">1 min</div>
        <ABCD candles={candles1Min} points={points1Min} />
      </div>
    </div>
  );
};

export default AdPage;
