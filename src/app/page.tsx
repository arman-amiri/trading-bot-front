import Link from "next/link";

export default function Home() {
  return (
    <div className="flex justify-start items-center pt-20 bg-black h-screen flex-col gap-4">
      <Link
        href="ichimoku"
        className="bg-blue-600 p-4 rounded-2xl text-white h-max w-max"
      >
        مشاهده نمودار کندل ها براساس الگوی ایچیموکو
      </Link>
      <Link
        href="ichimoku/candlestick"
        className="bg-blue-600 p-4 rounded-2xl text-white h-max w-max"
      >
        مشاهده نمودار کندل ها براساس الگوی ایچیموکو در نمودار candlestick
      </Link>
      <Link
        href="ichimoku/zikzag"
        className="bg-blue-600 p-4 rounded-2xl text-white h-max w-max"
      >
        zikzag{" "}
      </Link>
      <Link
        href="ichimoku/cycle"
        className="bg-blue-600 p-4 rounded-2xl text-white h-max w-max"
      >
        cycle{" "}
      </Link>
      <Link
        href="ichimoku/abcd"
        className="bg-blue-600 p-4 rounded-2xl text-white h-max w-max"
      >
        abcd{" "}
      </Link>
    </div>
  );
}
