import EntryCard from "@/components/EntryCard";

export default function HomePage() {
  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col px-6 py-12 sm:py-20">
      <header className="text-center">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
          Cambridge Starters Practice
        </h1>
        <p className="mt-3 text-base text-slate-600 sm:text-lg">
          自用的 Starters 複習與模擬測驗系統
        </p>
      </header>

      <section className="mt-12 grid gap-6 sm:grid-cols-2">
        <EntryCard
          href="/review"
          emoji="📚"
          title="複習區"
          description="單字、圖片、發音與例句複習"
        />
        <EntryCard
          href="/quiz"
          emoji="📝"
          title="測驗區"
          description="Listening、Matching、填空與模擬考練習"
        />
      </section>

      <footer className="mt-auto pt-16 text-center text-xs text-slate-400">
        v0.1 · 初始骨架
      </footer>
    </main>
  );
}
