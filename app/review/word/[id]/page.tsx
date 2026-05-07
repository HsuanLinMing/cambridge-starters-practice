import Link from "next/link";
import { notFound } from "next/navigation";
import VocabularyCard from "@/components/VocabularyCard";
import {
  getAllWordIds,
  getWordNavigation,
} from "@/lib/vocabularyNavigation";

type WordPageProps = {
  params: Promise<{ id: string }>;
};

export function generateStaticParams() {
  return getAllWordIds().map((id) => ({ id }));
}

export async function generateMetadata({ params }: WordPageProps) {
  const { id } = await params;
  const nav = getWordNavigation(id);
  if (!nav) {
    return { title: "找不到單字 · Cambridge Starters Practice" };
  }
  return {
    title: `${nav.current.word} · 單字複習 · Cambridge Starters Practice`,
  };
}

export default async function WordPage({ params }: WordPageProps) {
  const { id } = await params;
  const nav = getWordNavigation(id);
  if (!nav) notFound();

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col px-4 py-8 sm:px-6 sm:py-10">
      <Link
        href={`/review/letter/${nav.letter.toLowerCase()}`}
        className="inline-flex items-center text-sm text-slate-500 hover:text-slate-800"
      >
        <span className="mr-1">←</span> 回 {nav.letter} 總覽
      </Link>

      <section className="mt-6">
        <VocabularyCard item={nav.current} />
      </section>

      <nav
        className="mt-6 flex items-center justify-between gap-3 sm:gap-4"
        aria-label="單字導覽"
      >
        {nav.prev ? (
          <Link
            href={`/review/word/${nav.prev.id}`}
            className="flex min-h-14 flex-1 items-center justify-center gap-2 rounded-full bg-white px-4 py-3 text-base font-bold text-slate-700 shadow-sm transition hover:bg-amber-50 focus:outline-none focus-visible:ring-4 focus-visible:ring-amber-200 sm:text-lg"
          >
            <span aria-hidden>←</span> 上一個
          </Link>
        ) : (
          <span
            aria-disabled="true"
            className="flex min-h-14 flex-1 items-center justify-center gap-2 rounded-full bg-slate-100 px-4 py-3 text-base font-bold text-slate-300 sm:text-lg"
          >
            <span aria-hidden>←</span> 上一個
          </span>
        )}

        {nav.next ? (
          <Link
            href={`/review/word/${nav.next.id}`}
            className="flex min-h-14 flex-1 items-center justify-center gap-2 rounded-full bg-amber-400 px-4 py-3 text-base font-bold text-white shadow-sm transition hover:bg-amber-500 focus:outline-none focus-visible:ring-4 focus-visible:ring-amber-200 sm:text-lg"
          >
            下一個 <span aria-hidden>→</span>
          </Link>
        ) : (
          <span
            aria-disabled="true"
            className="flex min-h-14 flex-1 items-center justify-center gap-2 rounded-full bg-slate-100 px-4 py-3 text-base font-bold text-slate-300 sm:text-lg"
          >
            下一個 <span aria-hidden>→</span>
          </span>
        )}
      </nav>
    </main>
  );
}
