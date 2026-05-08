import vocabularyJson from "@/data/vocabulary.json";
import quizzesJson from "@/data/quizzes.json";
import p3ExampleQuestionsJson from "@/data/p3-example-questions.json";
import examPapersExampleJson from "@/data/exam-papers.example.json";
import type {
  ExamPaper,
  ExamQuestion,
  Quiz,
  VocabularyItem,
} from "./types";

export const vocabulary: VocabularyItem[] = vocabularyJson as VocabularyItem[];
export const quizzes: Quiz[] = quizzesJson as Quiz[];

/**
 * P3-1 範例題庫（schema 演示）。
 * 目前供 `/quiz` P3-6-A 最小可玩流程使用；尚未經 P3-2-B 轉換工具或人工審核流程，
 * 請暫不依賴它作為正式題庫來源。
 */
export const p3ExampleQuestions =
  p3ExampleQuestionsJson as unknown as ExamQuestion[];

/**
 * P3-1 範例考卷（schema 演示）。
 * 目前僅一份 `starters-mock-001`，供 `/quiz` P3-6-A 最小可玩流程使用。
 */
export const p3ExamplePapers =
  examPapersExampleJson as unknown as ExamPaper[];
