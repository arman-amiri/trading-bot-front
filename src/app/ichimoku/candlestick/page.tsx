import CandlestickChart from "@/app/__components/ichimokuchart/CandlestickChart";

export default function IchimokuPage() {
  return (
    <>
      <div className="bg-black h-screen p-10">
        <CandlestickChart />
      </div>
    </>
  );
}
