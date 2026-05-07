"use client";

import type { CategoryMeta } from "@/lib/categories";
import type { VocabularyCategory } from "@/lib/types";

type CategoryTabsProps = {
  categories: CategoryMeta[];
  selected: VocabularyCategory;
  onSelect: (key: VocabularyCategory) => void;
};

export default function CategoryTabs({
  categories,
  selected,
  onSelect,
}: CategoryTabsProps) {
  return (
    <div role="tablist" className="flex flex-wrap justify-center gap-3">
      {categories.map((cat) => {
        const isActive = cat.key === selected;
        return (
          <button
            key={cat.key}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => onSelect(cat.key)}
            className={
              "flex min-h-14 items-center gap-2 rounded-full px-5 py-3 text-base font-semibold shadow-sm transition focus:outline-none focus-visible:ring-4 focus-visible:ring-amber-200 " +
              (isActive
                ? "bg-amber-300 text-slate-900 ring-2 ring-amber-400"
                : "bg-white text-slate-700 hover:bg-amber-50")
            }
          >
            <span className="text-2xl" aria-hidden>
              {cat.emoji}
            </span>
            <span>{cat.label}</span>
          </button>
        );
      })}
    </div>
  );
}
