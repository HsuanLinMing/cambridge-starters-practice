import Link from "next/link";
import BackToHome from "@/components/BackToHome";
import ReviewHubCard from "@/components/ReviewHubCard";

export const metadata = {
  title: "複習中心 · Cambridge Starters Practice",
};

export default function ReviewHubPage() {
  return (
    <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col px-4 py-8 sm:px-6 sm:py-10">
      <BackToHome />
      <header className="mt-4 text-center">
        <h1 className="text-3xl font-black text-slate-900 sm:text-4xl">
          📚 複習中心
        </h1>
        <p className="mt-2 text-base text-slate-600 sm:text-lg">
          選一個方式開始複習！
        </p>
      </header>

      <section className="mt-8 grid gap-4 sm:grid-cols-2 sm:gap-6">
        <ReviewHubCard
          href="/review/words"
          emoji="📖"
          title="單字複習"
          description="A~Z 單字、圖片、發音、看答案"
        />
        <ReviewHubCard
          href="/review/picture"
          emoji="🖼️"
          title="看圖練習"
          description="看圖選英文、看英文選圖"
        />
        <ReviewHubCard
          status="coming-soon"
          emoji="🎧"
          title="聽力練習"
          description="聽單字、聽句子、選圖片"
        />
        <ReviewHubCard
          status="coming-soon"
          emoji="💬"
          title="句型練習"
          description="This is... / I can see... / There is..."
        />
        <ReviewHubCard
          status="coming-soon"
          emoji="🎨"
          title="位置 / 顏色 / 數量"
          description="in / on / under、red ball、three apples"
        />
      </section>

      <aside className="mt-10 text-center text-sm text-slate-500">
        想做完整考卷？請到{" "}
        <Link
          href="/quiz"
          className="font-semibold text-slate-700 underline-offset-2 hover:text-slate-900 hover:underline focus:outline-none focus-visible:underline"
        >
          測驗區 →
        </Link>
      </aside>
    </main>
  );
}
