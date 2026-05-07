import type { VocabularyCategory } from "./types";

export type CategoryMeta = {
  key: VocabularyCategory;
  label: string;
  emoji: string;
};

const categoryMetaMap: Record<VocabularyCategory, CategoryMeta> = {
  food: { key: "food", label: "食物", emoji: "🍎" },
  animals: { key: "animals", label: "動物", emoji: "🐶" },
  colors: { key: "colors", label: "顏色", emoji: "🎨" },
  numbers: { key: "numbers", label: "數字", emoji: "🔢" },
  family: { key: "family", label: "家人", emoji: "👨‍👩‍👧" },
  body: { key: "body", label: "身體", emoji: "🖐️" },
  school: { key: "school", label: "學校", emoji: "🏫" },
  home: { key: "home", label: "家", emoji: "🏠" },
  weather: { key: "weather", label: "天氣", emoji: "☀️" },
  actions: { key: "actions", label: "動作", emoji: "🏃" },
  other: { key: "other", label: "其他", emoji: "✨" },
};

export function getCategoryMeta(key: VocabularyCategory): CategoryMeta {
  return categoryMetaMap[key];
}
