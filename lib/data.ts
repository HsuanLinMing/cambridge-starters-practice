import vocabularyJson from "@/data/vocabulary.json";
import quizzesJson from "@/data/quizzes.json";
import type { Quiz, VocabularyItem } from "./types";

export const vocabulary: VocabularyItem[] = vocabularyJson as VocabularyItem[];
export const quizzes: Quiz[] = quizzesJson as Quiz[];
