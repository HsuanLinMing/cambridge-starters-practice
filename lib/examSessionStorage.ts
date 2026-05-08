"use client";

import type { ExamQuestion } from "./types";

/**
 * P3-6-B-1 localStorage Exam Session helper（第一刀）。
 *
 * 集中處理 `/quiz` 作答進度的 localStorage 讀寫；try/catch 防壞資料造成頁面崩潰。
 *
 * Schema 與 `lib/types.ts` 的 `ExamSessionState` 概念對齊但**精簡**——
 * 第一刀只存最小必要欄位（不含 `examSessionId` / `score` / `wrongQuestionIds`）。
 * 未來 P3-6-B-3+ 可逐步擴張並遞增 `schemaVersion` + 寫對應 migration。
 *
 * 嚴守邊界：
 * - 只存使用者作答狀態。
 * - 不存官方資料。
 * - 不存圖片本體 / 音檔本體。
 */

export const QUIZ_SESSION_KEY = "cambridge-starters-practice:quiz-session:v1";
export const QUIZ_SESSION_SCHEMA_VERSION = 1;

/** P3-6-B-1 精簡 session（不是 `ExamSessionState` 全集，但 paperId / questionOrder / currentIndex / answers / submitted 概念對齊）。 */
export type QuizSession = {
  schemaVersion: number;
  paperId: string;
  questionOrder: string[];
  currentIndex: number;
  /** key = 題目 id；value = 使用者輸入字串。matching 第一版用 `_done` token。 */
  answers: Record<string, string>;
  submitted: boolean;
  /** ISO 8601；session 建立時間。 */
  startedAt: string;
  /** ISO 8601；最後互動時間。 */
  updatedAt: string;
  /** ISO 8601；交卷時間（可選）。 */
  submittedAt?: string;
};

export function createEmptySession(
  paperId: string,
  questions: ExamQuestion[],
): QuizSession {
  const now = new Date().toISOString();
  return {
    schemaVersion: QUIZ_SESSION_SCHEMA_VERSION,
    paperId,
    questionOrder: questions.map((q) => q.id),
    currentIndex: 0,
    answers: {},
    submitted: false,
    startedAt: now,
    updatedAt: now,
  };
}

export function loadSession(): QuizSession | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(QUIZ_SESSION_KEY);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    if (!isQuizSessionShape(parsed)) return null;
    return parsed;
  } catch {
    // JSON parse 失敗 / SecurityError / QuotaExceeded — 一律當沒有 session
    return null;
  }
}

export function saveSession(session: QuizSession): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(QUIZ_SESSION_KEY, JSON.stringify(session));
  } catch {
    // 寫入失敗不影響使用者作答；下次 reload 進度會掉但不 crash
  }
}

export function clearSession(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(QUIZ_SESSION_KEY);
  } catch {
    // ignore
  }
}

/**
 * 判斷 localStorage 中的 session 是否與目前 paper / questions 相容。
 * 不相容（schemaVersion / paperId / questionOrder 任一不符）即丟棄舊 session、開新 session。
 */
export function isCompatibleSession(
  session: QuizSession,
  paperId: string,
  questions: ExamQuestion[],
): boolean {
  if (session.schemaVersion !== QUIZ_SESSION_SCHEMA_VERSION) return false;
  if (session.paperId !== paperId) return false;
  if (session.questionOrder.length !== questions.length) return false;
  for (let i = 0; i < questions.length; i += 1) {
    if (session.questionOrder[i] !== questions[i].id) return false;
  }
  return true;
}

// ---------- internal ----------

function isQuizSessionShape(value: unknown): value is QuizSession {
  if (typeof value !== "object" || value === null) return false;
  const v = value as Record<string, unknown>;
  if (typeof v.schemaVersion !== "number") return false;
  if (typeof v.paperId !== "string") return false;
  if (!Array.isArray(v.questionOrder)) return false;
  if (!v.questionOrder.every((id) => typeof id === "string")) return false;
  if (typeof v.currentIndex !== "number") return false;
  if (typeof v.submitted !== "boolean") return false;
  if (typeof v.startedAt !== "string") return false;
  if (typeof v.updatedAt !== "string") return false;
  if (v.submittedAt !== undefined && typeof v.submittedAt !== "string") {
    return false;
  }
  if (typeof v.answers !== "object" || v.answers === null) return false;
  for (const a of Object.values(v.answers as Record<string, unknown>)) {
    if (typeof a !== "string") return false;
  }
  return true;
}
