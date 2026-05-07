"use client";

import { useMemo, useState } from "react";
import CategoryTabs from "@/components/CategoryTabs";
import VocabularyCard from "@/components/VocabularyCard";
import { getCategoryMeta, type CategoryMeta } from "@/lib/categories";
import type { VocabularyCategory, VocabularyItem } from "@/lib/types";

type VocabularyReviewProps = {
  vocabulary: VocabularyItem[];
};

export default function VocabularyReview({
  vocabulary,
}: VocabularyReviewProps) {
  const categoriesInData = useMemo<CategoryMeta[]>(() => {
    const seen = new Set<VocabularyCategory>();
    const result: CategoryMeta[] = [];
    for (const item of vocabulary) {
      if (!seen.has(item.category)) {
        seen.add(item.category);
        result.push(getCategoryMeta(item.category));
      }
    }
    return result;
  }, [vocabulary]);

  const [selectedCategory, setSelectedCategory] =
    useState<VocabularyCategory | null>(categoriesInData[0]?.key ?? null);
  const [index, setIndex] = useState(0);

  const filtered = useMemo(
    () =>
      selectedCategory
        ? vocabulary.filter((v) => v.category === selectedCategory)
        : [],
    [vocabulary, selectedCategory],
  );

  const safeIndex = filtered.length === 0 ? 0 : Math.min(index, filtered.length - 1);
  const current = filtered[safeIndex];

  const handleSelectCategory = (key: VocabularyCategory) => {
    setSelectedCategory(key);
    setIndex(0);
  };

  const goPrev = () => {
    if (filtered.length === 0) return;
    setIndex((i) => (i - 1 + filtered.length) % filtered.length);
  };

  const goNext = () => {
    if (filtered.length === 0) return;
    setIndex((i) => (i + 1) % filtered.length);
  };

  if (categoriesInData.length === 0 || !selectedCategory) {
    return (
      <div className="rounded-3xl bg-white p-8 text-center text-slate-500 shadow-sm">
        目前還沒有單字，請稍後再來。
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <CategoryTabs
        categories={categoriesInData}
        selected={selectedCategory}
        onSelect={handleSelectCategory}
      />

      {current ? (
        <>
          <VocabularyCard key={current.id} item={current} />

          <div className="flex items-center justify-between gap-4">
            <button
              type="button"
              onClick={goPrev}
              aria-label="上一個單字"
              className="flex min-h-14 flex-1 items-center justify-center gap-2 rounded-full bg-white px-5 py-3 text-lg font-bold text-slate-700 shadow-sm transition hover:bg-amber-50 focus:outline-none focus-visible:ring-4 focus-visible:ring-amber-200"
            >
              <span aria-hidden>←</span> 上一個
            </button>

            <div className="min-w-16 text-center text-base font-semibold text-slate-500">
              {safeIndex + 1} / {filtered.length}
            </div>

            <button
              type="button"
              onClick={goNext}
              aria-label="下一個單字"
              className="flex min-h-14 flex-1 items-center justify-center gap-2 rounded-full bg-amber-400 px-5 py-3 text-lg font-bold text-white shadow-sm transition hover:bg-amber-500 focus:outline-none focus-visible:ring-4 focus-visible:ring-amber-200"
            >
              下一個 <span aria-hidden>→</span>
            </button>
          </div>
        </>
      ) : (
        <div className="rounded-3xl bg-white p-8 text-center text-slate-500 shadow-sm">
          這個分類目前還沒有單字。
        </div>
      )}
    </div>
  );
}
