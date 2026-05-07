import Link from "next/link";
import PicturePractice from "@/components/PicturePractice";
import { vocabulary } from "@/lib/data";

export const metadata = {
  title: "看圖練習 · Cambridge Starters Practice",
};

export default function PicturePracticePage() {
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col px-4 py-8 sm:px-6 sm:py-10">
      <Link
        href="/review"
        className="inline-flex items-center text-sm text-slate-500 hover:text-slate-800"
      >
        <span className="mr-1">←</span> 回複習中心
      </Link>

      <header className="mt-4 text-center">
        <h1 className="text-3xl font-black text-slate-900 sm:text-4xl">
          🖼️ 看圖練習
        </h1>
        <p className="mt-2 text-base text-slate-600 sm:text-lg">
          看看圖片，選出正確的英文單字
        </p>
      </header>

      <section className="mt-8">
        <PicturePractice vocabulary={vocabulary} />
      </section>
    </main>
  );
}
