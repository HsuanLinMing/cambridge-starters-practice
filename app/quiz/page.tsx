import BackToHome from "@/components/BackToHome";

export const metadata = {
  title: "測驗區 · Cambridge Starters Practice",
};

export default function QuizPage() {
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col px-6 py-10">
      <BackToHome />
      <header className="mt-6">
        <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">
          測驗區
        </h1>
        <p className="mt-2 text-sm text-slate-600">
          Listening、Matching、填空與模擬考練習。本頁為入口骨架，後續會加入題目流程與計分。
        </p>
      </header>

      <section className="mt-8 rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center text-slate-500">
        🚧 尚未實作。下一步預計：載入 <code>data/quizzes.json</code> 並渲染選擇題流程。
      </section>
    </main>
  );
}
