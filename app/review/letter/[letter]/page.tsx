import Link from "next/link";
import { notFound } from "next/navigation";
import { ALPHABET, getWordsForLetter } from "@/lib/vocabularyNavigation";

type LetterPageProps = {
  params: Promise<{ letter: string }>;
};

export function generateStaticParams() {
  return ALPHABET.map((letter) => ({ letter: letter.toLowerCase() }));
}

export async function generateMetadata({ params }: LetterPageProps) {
  const { letter } = await params;
  const upper = letter.toUpperCase();
  return {
    title: `${upper} · 單字複習 · Cambridge Starters Practice`,
  };
}

export default async function LetterPage({ params }: LetterPageProps) {
  const { letter } = await params;
  const upper = letter.toUpperCase();
  if (!ALPHABET.includes(upper)) {
    notFound();
  }
  const words = getWordsForLetter(upper);

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col px-4 py-8 sm:px-6 sm:py-10">
      <Link
        href="/review/words"
        className="inline-flex items-center text-sm text-slate-500 hover:text-slate-800"
      >
        <span className="mr-1">←</span> 回單字複習
      </Link>

      <header className="mt-6 text-center">
        <h1 className="text-7xl font-black text-amber-500 sm:text-8xl">
          {upper}
        </h1>
        <p className="mt-2 text-base text-slate-600 sm:text-lg">
          {upper} 開頭的單字
        </p>
      </header>

      <section className="mt-8">
        {words.length === 0 ? (
          <div className="flex flex-col items-center gap-4 rounded-3xl bg-white p-8 text-center shadow-sm">
            <p className="text-base text-slate-500">這個字母還沒有單字。</p>
            <Link
              href="/review/words"
              className="inline-flex min-h-12 items-center rounded-full bg-amber-300 px-6 py-3 text-base font-bold text-slate-900 shadow-sm transition hover:bg-amber-400 focus:outline-none focus-visible:ring-4 focus-visible:ring-amber-200"
            >
              回單字複習
            </Link>
          </div>
        ) : (
          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4">
            {words.map((w) => (
              <li key={w.id}>
                <Link
                  href={`/review/word/${w.id}`}
                  className="flex min-h-24 flex-col items-center justify-center rounded-2xl bg-white p-4 text-center shadow-sm ring-1 ring-amber-100 transition hover:-translate-y-0.5 hover:ring-amber-300 focus:outline-none focus-visible:ring-4 focus-visible:ring-amber-200"
                >
                  <span className="text-2xl font-bold text-slate-900 sm:text-3xl">
                    {w.word}
                  </span>
                  <span className="mt-1 text-sm text-slate-600 sm:text-base">
                    {w.translation}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
