import BackToHome from "@/components/BackToHome";

export const metadata = {
  title: "複習區 · Cambridge Starters Practice",
};

export default function ReviewPage() {
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col px-6 py-10">
      <BackToHome />
      <header className="mt-6">
        <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">
          複習區
        </h1>
        <p className="mt-2 text-sm text-slate-600">
          單字、圖片、發音與例句複習。本頁為入口骨架，後續會加入單字卡、主題分類與發音播放。
        </p>
      </header>

      <section className="mt-8 rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center text-slate-500">
        🚧 尚未實作。下一步預計：載入 <code>data/vocabulary.json</code> 並渲染單字卡。
      </section>
    </main>
  );
}
