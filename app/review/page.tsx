import Link from "next/link";
import BackToHome from "@/components/BackToHome";
import { getLetterStatuses } from "@/lib/vocabularyNavigation";

export const metadata = {
  title: "單字複習 · Cambridge Starters Practice",
};

export default function ReviewPage() {
  const letters = getLetterStatuses();

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col px-4 py-8 sm:px-6 sm:py-10">
      <BackToHome />
      <header className="mt-4 text-center">
        <h1 className="text-3xl font-black text-slate-900 sm:text-4xl">
          📚 單字複習
        </h1>
        <p className="mt-2 text-base text-slate-600 sm:text-lg">
          選一個字母看看單字
        </p>
      </header>

      <section className="mt-8">
        <ul className="grid grid-cols-3 gap-3 sm:grid-cols-4 sm:gap-4 md:grid-cols-5">
          {letters.map(({ letter, count, enabled }) => (
            <li key={letter}>
              {enabled ? (
                <Link
                  href={`/review/letter/${letter.toLowerCase()}`}
                  aria-label={`${letter}，${count} 個單字`}
                  className="flex aspect-square flex-col items-center justify-center rounded-2xl bg-amber-300 text-slate-900 shadow-md transition hover:-translate-y-0.5 hover:bg-amber-400 focus:outline-none focus-visible:ring-4 focus-visible:ring-amber-200"
                >
                  <span className="text-4xl font-black sm:text-5xl">
                    {letter}
                  </span>
                  <span className="mt-1 text-xs font-semibold sm:text-sm">
                    {count} 個單字
                  </span>
                </Link>
              ) : (
                <div
                  aria-disabled="true"
                  aria-label={`${letter}，目前沒有單字`}
                  className="flex aspect-square flex-col items-center justify-center rounded-2xl bg-slate-100 text-slate-400"
                >
                  <span className="text-4xl font-black sm:text-5xl">
                    {letter}
                  </span>
                  <span className="mt-1 text-xs sm:text-sm">—</span>
                </div>
              )}
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
