import { vocabulary } from "./data";
import type { VocabularyItem } from "./types";

export const ALPHABET: readonly string[] = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split(
  "",
);

const sortedVocabulary: VocabularyItem[] = [...vocabulary].sort((a, b) =>
  a.word.localeCompare(b.word, "en"),
);

export type LetterStatus = {
  letter: string;
  count: number;
  enabled: boolean;
};

export function getLetterStatuses(): LetterStatus[] {
  return ALPHABET.map((letter) => {
    const count = sortedVocabulary.filter(
      (v) => v.word.charAt(0).toUpperCase() === letter,
    ).length;
    return { letter, count, enabled: count > 0 };
  });
}

export function getWordsForLetter(letter: string): VocabularyItem[] {
  const upper = letter.toUpperCase();
  return sortedVocabulary.filter(
    (v) => v.word.charAt(0).toUpperCase() === upper,
  );
}

export type WordNavigation = {
  current: VocabularyItem;
  prev: VocabularyItem | null;
  next: VocabularyItem | null;
  letter: string;
};

export function getWordNavigation(id: string): WordNavigation | null {
  const idx = sortedVocabulary.findIndex((v) => v.id === id);
  if (idx === -1) return null;
  const current = sortedVocabulary[idx];
  return {
    current,
    prev: idx > 0 ? sortedVocabulary[idx - 1] : null,
    next:
      idx < sortedVocabulary.length - 1 ? sortedVocabulary[idx + 1] : null,
    letter: current.word.charAt(0).toUpperCase(),
  };
}

export function getAllWordIds(): string[] {
  return sortedVocabulary.map((v) => v.id);
}
