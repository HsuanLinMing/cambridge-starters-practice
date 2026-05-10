"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  type QuizSession,
  clearSession,
  createEmptySession,
  isCompatibleSession,
  loadSession,
  saveSession,
} from "@/lib/examSessionStorage";
import type {
  ExamMultipleChoiceQuestion,
  ExamQuestion,
  FillBlankQuestion,
  ImageOption,
  ListeningChoiceQuestion,
  MatchingQuestion,
  PictureChoiceQuestion,
  StarterPart,
  WordChoiceQuestion,
} from "@/lib/types";

/**
 * P3-6-B-1 / P3-6-B-2：Exam Session localStorage 持久化第一刀。
 *
 * - 作答進度（currentIndex / answers / submitted）保存於 localStorage（`lib/examSessionStorage.ts`）。
 * - 重新整理 / 重開分頁可恢復進度（paperId 與 questionOrder 皆相容才恢復）。
 * - 新增「重新測驗」（清除 session、回第一題）與「直接交卷」（提前進結果頁）按鈕。
 * - 結果頁顯示 答對 N / M、已作答 X / M、未作答 M-X、鼓勵語、重新測驗。
 *
 * 仍不做：完整每題詳解、錯題複習頁、計時器、AI / TTS / Speaking。
 */

const MATCHING_DONE_TOKEN = "_done";

// 段落徽章標示（對齊正式 Cambridge Starters 結構：Listening / Reading & Writing）
type SectionTag = "listening" | "reading-writing";

const SECTION_LABELS: Record<
  SectionTag,
  { number: number; en: string; zh: string }
> = {
  listening: { number: 1, en: "Listening", zh: "聽力練習" },
  "reading-writing": {
    number: 2,
    en: "Reading & Writing",
    zh: "閱讀與書寫練習",
  },
};

function getSectionTag(question: ExamQuestion): SectionTag {
  // P3-9-B：優先讀 metadata；speaking 屬 P4，本輪不會出現於 /quiz
  if (question.starterSection === "listening") return "listening";
  if (question.starterSection === "reading-writing") return "reading-writing";
  // fallback：依 question.type 推導
  return question.type === "listening-choice" ? "listening" : "reading-writing";
}

/**
 * 練習版題型 → 正式 Cambridge Pre A1 Starters parts 的近似對應。
 * 「preview」表示本練習尚未完整對齊該 part；UI 文案會補一句「練習版，逐步對齊正式 Starters」。
 */
type StarterPartInfo = {
  /** 顯示給使用者的 Part 標籤（含 preview 字樣） */
  partLabel: string;
  /** 該題型對應的中文題型描述 */
  zhTitle: string;
};

/**
 * P3-9-B：Starters Part metadata 的顯示對應表。
 * 對齊 `docs/STARTERS_PART_TEMPLATES.md` v1 模板的 9 個 part 中文題型描述；
 * SP1~SP4 屬 P4 預留，本輪不會在 /quiz 出現。
 */
const STARTER_PART_DISPLAY: Record<StarterPart, StarterPartInfo> = {
  L1: { partLabel: "Part 1", zhTitle: "聽句子配人物 / 物件位置" },
  L2: { partLabel: "Part 2", zhTitle: "聽對話寫 name / number" },
  L3: { partLabel: "Part 3", zhTitle: "聽音選圖" },
  L4: { partLabel: "Part 4", zhTitle: "聽指令 · 顏色 / 物件" },
  RW1: { partLabel: "Part 1", zhTitle: "看圖判斷 / 看圖選答案" },
  RW2: { partLabel: "Part 2", zhTitle: "看大圖回答 yes / no" },
  RW3: { partLabel: "Part 3", zhTitle: "看圖認字 / 拼字練習" },
  RW4: { partLabel: "Part 4", zhTitle: "短文 / 句子填空" },
  RW5: { partLabel: "Part 5", zhTitle: "圖文配對 / 故事理解預備" },
  SP1: { partLabel: "Part 1（P4）", zhTitle: "口說 Part 1（P4 預留）" },
  SP2: { partLabel: "Part 2（P4）", zhTitle: "口說 Part 2（P4 預留）" },
  SP3: { partLabel: "Part 3（P4）", zhTitle: "口說 Part 3（P4 預留）" },
  SP4: { partLabel: "Part 4（P4）", zhTitle: "口說 Part 4（P4 預留）" },
};

/**
 * 顯示 Part 標示。
 *
 * 邏輯：
 * 1. metadata（`starterSection` / `starterPart`）決定 section / part 的對齊目標。
 * 2. `question.type` 可協助顯示更精準的練習版文案——同一個 starterPart 下，
 *    不同題型的實際練習形式可能差很多（例如 RW4 在官方包含「短文填空」與
 *    「短句選字 preview」兩種偏向，本練習版用 `multiple-choice` 仿前者預備、
 *    用 `fill-blank` 仿後者）。
 * 3. fallback：metadata 未補時依 `question.type` 推導，保留「preview」字樣
 *    以區分尚未補 metadata 的舊資料。
 *
 * 提醒：所有顯示文案皆為「練習版近似對應」，不代表官方題目本身。
 */
function getStarterPartInfo(question: ExamQuestion): StarterPartInfo {
  // P3-9-C 小修：(starterPart, question.type) 組合細分文案。
  // 目前只覆寫一條：RW4 + multiple-choice 顯示「短句選字 / 詞彙選擇 preview」，
  // 避免被籠統顯示為「短文 / 句子填空」（後者更貼近 fill-blank 的實際形式）。
  if (question.starterPart === "RW4" && question.type === "multiple-choice") {
    return { partLabel: "Part 4 preview", zhTitle: "短句選字 / 詞彙選擇" };
  }

  // P3-9-B：優先讀 metadata
  if (question.starterPart) {
    return STARTER_PART_DISPLAY[question.starterPart];
  }
  // fallback：依 question.type 推導（保留 preview 字樣以區分尚未補 metadata 的舊資料）
  switch (question.type) {
    case "listening-choice":
      return { partLabel: "Part 3", zhTitle: "聽音選圖" };
    case "picture-choice":
      return {
        partLabel: "Part 1 / Part 2 preview",
        zhTitle: "看圖判斷 / 看圖選答案",
      };
    case "word-choice":
      return { partLabel: "Part 3", zhTitle: "看圖認字 / 拼字練習" };
    case "multiple-choice":
      return { partLabel: "Part 4 preview", zhTitle: "短句選字" };
    case "fill-blank":
      return { partLabel: "Part 4", zhTitle: "短文 / 句子填空" };
    case "matching":
      return {
        partLabel: "Part 5 preview",
        zhTitle: "圖文配對 / 故事理解預備",
      };
  }
}

function normalize(s: string): string {
  return s.trim().toLowerCase();
}

function isCorrect(question: ExamQuestion, answer: string | undefined): boolean {
  if (answer === undefined || answer.length === 0) return false;
  if (question.type === "matching") {
    // 閱讀型：使用者按過「我看完了」即視為已完成（最小可玩，不做正式判分）
    return answer === MATCHING_DONE_TOKEN;
  }
  if (question.type === "fill-blank" && !question.options) {
    // 自由填空：忽略大小寫與前後空白
    return normalize(answer) === normalize(question.answer);
  }
  // multiple-choice / picture-choice / word-choice / listening-choice / fill-blank（選項版）
  return answer === question.answer;
}

function isAnswered(answer: string | undefined): boolean {
  return answer !== undefined && answer.length > 0;
}

type QuizPlayProps = {
  paperId: string;
  questions: ExamQuestion[];
};

export default function QuizPlay({ paperId, questions }: QuizPlayProps) {
  // 初始 session：SSR + 第一次 client render 都用乾淨 empty session（純 props 推導，避免 hydration mismatch）
  const [session, setSession] = useState<QuizSession>(() =>
    createEmptySession(paperId, questions),
  );
  const [hydrated, setHydrated] = useState(false);
  const [restoredHint, setRestoredHint] = useState(false);

  // Hydration：嘗試從 localStorage 恢復進度。
  // setState 放進 queueMicrotask（非同步 callback）以避開 react-hooks/set-state-in-effect。
  useEffect(() => {
    let cancelled = false;
    queueMicrotask(() => {
      if (cancelled) return;
      const stored = loadSession();
      if (stored && isCompatibleSession(stored, paperId, questions)) {
        setSession(stored);
        if (
          stored.currentIndex > 0 ||
          Object.keys(stored.answers).length > 0 ||
          stored.submitted
        ) {
          setRestoredHint(true);
        }
      }
      setHydrated(true);
    });
    return () => {
      cancelled = true;
    };
  }, [paperId, questions]);

  // 寫回 localStorage：必須等 hydration 完成才寫，避免 race（初始 empty session 蓋掉舊 session）。
  useEffect(() => {
    if (!hydrated) return;
    saveSession(session);
  }, [session, hydrated]);

  // 再練習模式（retry mode）— P3-6-B-4 第二刀：純 in-memory state，不存 localStorage、不升 schemaVersion。
  // null 代表非 retry 模式；string[] 代表 retry 模式的題目 id 清單。
  const [retryQuestionIds, setRetryQuestionIds] = useState<string[] | null>(
    null,
  );
  const [retryAnswers, setRetryAnswers] = useState<Record<string, string>>({});
  const [retryIndex, setRetryIndex] = useState(0);
  const [retrySubmitted, setRetrySubmitted] = useState(false);

  const inRetry = retryQuestionIds !== null;
  const retryIdSet = new Set(retryQuestionIds ?? []);
  const retryQuestions = inRetry
    ? questions.filter((q) => retryIdSet.has(q.id))
    : [];
  const retryTotal = retryQuestions.length;

  const total = questions.length;
  const currentIndex = session.currentIndex;
  const current = questions[currentIndex];
  const isLast = currentIndex === total - 1;
  const currentAnswer = current ? session.answers[current.id] : undefined;
  const answered = isAnswered(currentAnswer);

  const updateSession = (partial: Partial<QuizSession>) => {
    setSession((prev) => ({
      ...prev,
      ...partial,
      updatedAt: new Date().toISOString(),
    }));
  };

  const handleSelectAnswer = (value: string) => {
    if (!current) return;
    setRestoredHint(false);
    setSession((prev) => ({
      ...prev,
      answers: { ...prev.answers, [current.id]: value },
      updatedAt: new Date().toISOString(),
    }));
  };

  const handleNext = () => {
    if (isLast) {
      const now = new Date().toISOString();
      updateSession({ submitted: true, submittedAt: now });
    } else {
      updateSession({ currentIndex: currentIndex + 1 });
    }
  };

  const handleSubmitNow = () => {
    const now = new Date().toISOString();
    updateSession({ submitted: true, submittedAt: now });
  };

  const resetRetryState = () => {
    setRetryQuestionIds(null);
    setRetryAnswers({});
    setRetryIndex(0);
    setRetrySubmitted(false);
  };

  const handleRestart = () => {
    clearSession();
    setSession(createEmptySession(paperId, questions));
    setRestoredHint(false);
    resetRetryState();
  };

  const handleStartRetry = (ids: string[]) => {
    if (ids.length === 0) return;
    setRetryQuestionIds(ids);
    setRetryAnswers({});
    setRetryIndex(0);
    setRetrySubmitted(false);
  };

  const handleExitRetry = () => {
    resetRetryState();
  };

  const handleSelectRetryAnswer = (value: string) => {
    const retryCurrent = retryQuestions[retryIndex];
    if (!retryCurrent) return;
    setRetryAnswers((prev) => ({ ...prev, [retryCurrent.id]: value }));
  };

  const handleRetryNext = () => {
    if (retryIndex === retryTotal - 1) {
      setRetrySubmitted(true);
    } else {
      setRetryIndex((i) => i + 1);
    }
  };

  const handleRetrySubmitNow = () => {
    setRetrySubmitted(true);
  };

  if (total === 0) {
    return (
      <div className="rounded-3xl bg-white p-8 text-center text-slate-500 shadow-sm">
        目前沒有題目，請稍後再來。
      </div>
    );
  }

  // 再練習模式（retry mode）優先：在原始 quiz / 結果頁之前處理，避免雙重渲染
  if (inRetry) {
    if (retrySubmitted) {
      return (
        <RetryResultView
          retryQuestions={retryQuestions}
          retryAnswers={retryAnswers}
          allQuestions={questions}
          onExitRetry={handleExitRetry}
          onRestart={handleRestart}
        />
      );
    }

    const retryCurrent = retryQuestions[retryIndex];
    if (!retryCurrent) {
      // edge case：retryQuestionIds 設定後找不到對應題目（理論上不會發生）
      return (
        <div className="rounded-3xl bg-white p-8 text-center text-slate-500 shadow-sm">
          找不到再練習題目，請按下方按鈕回到完整結果。
          <div className="mt-4">
            <button
              type="button"
              onClick={handleExitRetry}
              className="flex min-h-12 items-center gap-2 rounded-full bg-white px-6 py-2 text-sm font-bold text-slate-600 shadow-sm ring-1 ring-slate-200 transition hover:bg-slate-50 focus:outline-none focus-visible:ring-4 focus-visible:ring-slate-200"
            >
              <span aria-hidden>↩</span> 返回完整結果
            </button>
          </div>
        </div>
      );
    }

    const retryCurrentAnswer = retryAnswers[retryCurrent.id];
    const retryAnswered = isAnswered(retryCurrentAnswer);
    const retryIsLast = retryIndex === retryTotal - 1;
    const retrySectionTag = getSectionTag(retryCurrent);
    const retrySection = SECTION_LABELS[retrySectionTag];
    const retryPartInfo = getStarterPartInfo(retryCurrent);
    const retrySectionAccent =
      retrySectionTag === "listening"
        ? "bg-sky-100 text-sky-800"
        : "bg-amber-100 text-amber-800";

    return (
      <div className="space-y-4">
        <div className="rounded-2xl bg-amber-50 px-4 py-3 text-center ring-1 ring-amber-200">
          <p className="text-sm font-bold text-amber-800">
            🔁 再練習模式：只練習錯題與未作答題
          </p>
          <p className="mt-1 text-xs text-amber-700">
            本次再練習結果<strong className="font-bold">不會覆蓋</strong>
            原始測驗分數；隨時可按下方「返回完整結果」回到原始結果頁。
          </p>
        </div>

        <article className="rounded-3xl bg-white p-6 shadow-md ring-1 ring-amber-100 sm:p-8">
          <div className="text-center">
            <div
              className={
                "inline-flex items-center gap-2 rounded-full px-4 py-1 text-xs font-bold " +
                retrySectionAccent
              }
            >
              <span>Section {retrySection.number}</span>
              <span aria-hidden>·</span>
              <span>{retrySection.en}</span>
              <span aria-hidden>｜</span>
              <span>{retrySection.zh}</span>
            </div>
            <p className="mt-2 text-sm font-bold text-slate-700">
              {retryPartInfo.partLabel}：{retryPartInfo.zhTitle}
            </p>
            <div className="mt-2 text-sm font-semibold text-slate-500">
              再練習 第 {retryIndex + 1} 題 / 共 {retryTotal} 題
            </div>
          </div>

          <QuestionView
            key={retryCurrent.id}
            question={retryCurrent}
            currentAnswer={retryCurrentAnswer}
            onSelectAnswer={handleSelectRetryAnswer}
          />

          <div className="mt-6 flex justify-center">
            <button
              type="button"
              disabled={!retryAnswered}
              onClick={handleRetryNext}
              className="flex min-h-14 items-center gap-2 rounded-full bg-amber-400 px-8 py-3 text-lg font-bold text-white shadow-md transition hover:bg-amber-500 focus:outline-none focus-visible:ring-4 focus-visible:ring-amber-200 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400 disabled:shadow-none"
            >
              {retryIsLast ? "看再練習結果" : "下一題"}{" "}
              <span aria-hidden>→</span>
            </button>
          </div>
        </article>

        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          <button
            type="button"
            onClick={handleRetrySubmitNow}
            className="flex min-h-12 items-center gap-2 rounded-full bg-white px-6 py-2 text-sm font-bold text-amber-700 shadow-sm ring-1 ring-amber-200 transition hover:bg-amber-50 focus:outline-none focus-visible:ring-4 focus-visible:ring-amber-200"
          >
            <span aria-hidden>📝</span> 直接交卷
          </button>
          <button
            type="button"
            onClick={handleExitRetry}
            className="flex min-h-12 items-center gap-2 rounded-full bg-white px-6 py-2 text-sm font-bold text-slate-600 shadow-sm ring-1 ring-slate-200 transition hover:bg-slate-50 focus:outline-none focus-visible:ring-4 focus-visible:ring-slate-200"
          >
            <span aria-hidden>↩</span> 返回完整結果
          </button>
        </div>
      </div>
    );
  }

  if (session.submitted) {
    return (
      <ResultView
        questions={questions}
        answers={session.answers}
        onRestart={handleRestart}
        onStartRetry={handleStartRetry}
      />
    );
  }

  if (!current) {
    return (
      <div className="rounded-3xl bg-white p-8 text-center text-slate-500 shadow-sm">
        找不到題目，請重新整理。
      </div>
    );
  }

  const sectionTag = getSectionTag(current);
  const section = SECTION_LABELS[sectionTag];
  const partInfo = getStarterPartInfo(current);
  const sectionAccent =
    sectionTag === "listening"
      ? "bg-sky-100 text-sky-800"
      : "bg-amber-100 text-amber-800";

  return (
    <div className="space-y-4">
      {restoredHint && (
        <div className="rounded-2xl bg-emerald-50 px-4 py-3 text-center text-sm font-semibold text-emerald-700 ring-1 ring-emerald-200">
          🔁 已恢復上次作答進度（按下方「重新測驗」可清除重來）
        </div>
      )}

      <article className="rounded-3xl bg-white p-6 shadow-md ring-1 ring-amber-100 sm:p-8">
        <div className="text-center">
          <div
            className={
              "inline-flex items-center gap-2 rounded-full px-4 py-1 text-xs font-bold " +
              sectionAccent
            }
          >
            <span>Section {section.number}</span>
            <span aria-hidden>·</span>
            <span>{section.en}</span>
            <span aria-hidden>｜</span>
            <span>{section.zh}</span>
          </div>
          <p className="mt-2 text-sm font-bold text-slate-700">
            {partInfo.partLabel}：{partInfo.zhTitle}
          </p>
          <div className="mt-2 text-sm font-semibold text-slate-500">
            第 {currentIndex + 1} 題 / 共 {total} 題
          </div>
        </div>

        <QuestionView
          key={current.id}
          question={current}
          currentAnswer={currentAnswer}
          onSelectAnswer={handleSelectAnswer}
        />

        <div className="mt-6 flex justify-center">
          <button
            type="button"
            disabled={!answered}
            onClick={handleNext}
            className="flex min-h-14 items-center gap-2 rounded-full bg-amber-400 px-8 py-3 text-lg font-bold text-white shadow-md transition hover:bg-amber-500 focus:outline-none focus-visible:ring-4 focus-visible:ring-amber-200 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400 disabled:shadow-none"
          >
            {isLast ? "看結果" : "下一題"} <span aria-hidden>→</span>
          </button>
        </div>
      </article>

      <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
        <button
          type="button"
          onClick={handleSubmitNow}
          className="flex min-h-12 items-center gap-2 rounded-full bg-white px-6 py-2 text-sm font-bold text-amber-700 shadow-sm ring-1 ring-amber-200 transition hover:bg-amber-50 focus:outline-none focus-visible:ring-4 focus-visible:ring-amber-200"
        >
          <span aria-hidden>📝</span> 直接交卷
        </button>
        <button
          type="button"
          onClick={handleRestart}
          className="flex min-h-12 items-center gap-2 rounded-full bg-white px-6 py-2 text-sm font-bold text-slate-600 shadow-sm ring-1 ring-slate-200 transition hover:bg-slate-50 focus:outline-none focus-visible:ring-4 focus-visible:ring-slate-200"
        >
          <span aria-hidden>🔁</span> 重新測驗
        </button>
      </div>
    </div>
  );
}

// =============================================================
// 完成畫面
// =============================================================

type QuestionStatus = "correct" | "incorrect" | "unanswered";

function getQuestionStatus(
  question: ExamQuestion,
  answer: string | undefined,
): QuestionStatus {
  if (!isAnswered(answer)) return "unanswered";
  return isCorrect(question, answer) ? "correct" : "incorrect";
}

/** 把使用者作答顯示為人類可讀文字（matching 用閱讀型描述、其他直接顯示原值）。 */
function formatUserAnswer(
  question: ExamQuestion,
  answer: string | undefined,
): string {
  if (!isAnswered(answer)) return "尚未作答";
  if (question.type === "matching") {
    return answer === MATCHING_DONE_TOKEN
      ? "已完成閱讀配對練習"
      : "（未完成）";
  }
  return answer as string;
}

/** 把正確答案顯示為人類可讀文字（matching 顯示閱讀型說明）。 */
function formatCorrectAnswer(question: ExamQuestion): string {
  if (question.type === "matching") {
    return "本題目前為閱讀型練習，完成即算正確";
  }
  return question.answer;
}

/** 結果頁顯示題目用的文字版（不重複貼大圖 / 大音檔，僅給家長辨識題目）。 */
function getQuestionPromptDisplay(question: ExamQuestion): string {
  if (question.type === "listening-choice") {
    return question.transcript ?? question.ttsScript ?? "（音檔內容）";
  }
  if (question.type === "word-choice") {
    return `這個英文單字是「${question.prompt}」`;
  }
  if (question.type === "picture-choice") {
    return question.prompt ?? "（看圖選字題）";
  }
  if (question.type === "matching") {
    return question.prompt ?? "（看圖配對題）";
  }
  // multiple-choice / fill-blank
  return question.prompt;
}

/** 沒有 explanation 時依狀態給鼓勵性 fallback。 */
function getExplanationDisplay(
  question: ExamQuestion,
  status: QuestionStatus,
): string {
  if (question.explanation) return question.explanation;
  if (status === "unanswered") return "下次可以再試一次～";
  if (status === "correct") return "答得很好！繼續加油！";
  return "再想一下，下次一定可以的～";
}

const STATUS_STYLES: Record<
  QuestionStatus,
  { bg: string; ring: string; chip: string; icon: string; label: string }
> = {
  correct: {
    bg: "bg-emerald-50",
    ring: "ring-emerald-200",
    chip: "bg-emerald-200 text-emerald-800",
    icon: "✓",
    label: "答對",
  },
  incorrect: {
    bg: "bg-rose-50",
    ring: "ring-rose-200",
    chip: "bg-rose-200 text-rose-800",
    icon: "✗",
    label: "答錯",
  },
  unanswered: {
    bg: "bg-amber-50",
    ring: "ring-amber-200",
    chip: "bg-amber-200 text-amber-800",
    icon: "?",
    label: "未作答",
  },
};

type DetailFilter = "all" | "incorrect" | "unanswered" | "review";

const FILTER_LABELS: Record<DetailFilter, string> = {
  all: "全部",
  incorrect: "只看錯題",
  unanswered: "只看未作答",
  review: "需要再練習",
};

const EMPTY_STATE_MESSAGES: Record<DetailFilter, string> = {
  all: "目前沒有題目。",
  incorrect: "太棒了，目前沒有答錯的題目！",
  unanswered: "很好，這次每一題都有作答！",
  review: "全部都很棒，這次沒有需要再練習的題目！",
};

const FILTER_ORDER: DetailFilter[] = [
  "all",
  "incorrect",
  "unanswered",
  "review",
];

type QuestionDetailCardProps = {
  question: ExamQuestion;
  index: number;
  userAnswer: string | undefined;
};

function QuestionDetailCard({
  question,
  index,
  userAnswer,
}: QuestionDetailCardProps) {
  const status = getQuestionStatus(question, userAnswer);
  const sectionTag = getSectionTag(question);
  const section = SECTION_LABELS[sectionTag];
  const partInfo = getStarterPartInfo(question);
  const userAnswerDisplay = formatUserAnswer(question, userAnswer);
  const correctAnswerDisplay = formatCorrectAnswer(question);
  const promptDisplay = getQuestionPromptDisplay(question);
  const explanation = getExplanationDisplay(question, status);
  const styles = STATUS_STYLES[status];

  return (
    <li
      className={`rounded-2xl ${styles.bg} p-4 ring-1 ${styles.ring}`}
      aria-label={`第 ${index + 1} 題 ${styles.label}`}
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs">
          <span className="font-bold text-slate-700">第 {index + 1} 題</span>
          <span aria-hidden className="text-slate-300">
            ·
          </span>
          <span className="text-slate-500">
            Section {section.number} {section.en}
          </span>
          <span aria-hidden className="text-slate-300">
            ·
          </span>
          <span className="text-slate-500">{partInfo.partLabel}</span>
        </div>
        <span
          className={`inline-flex items-center gap-1 rounded-full px-3 py-0.5 text-xs font-bold ${styles.chip}`}
        >
          <span aria-hidden>{styles.icon}</span>
          {styles.label}
        </span>
      </div>

      <p className="mt-3 text-sm text-slate-800">
        <span className="text-xs font-semibold text-slate-500">題目：</span>
        {promptDisplay}
      </p>

      <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
        <div className="rounded-xl bg-white px-3 py-2 ring-1 ring-slate-100">
          <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
            你的答案
          </div>
          <div
            className={
              "mt-1 text-sm font-bold " +
              (status === "unanswered"
                ? "text-amber-700"
                : status === "correct"
                  ? "text-emerald-700"
                  : "text-rose-700")
            }
          >
            {userAnswerDisplay}
          </div>
        </div>
        <div className="rounded-xl bg-white px-3 py-2 ring-1 ring-slate-100">
          <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
            正確答案
          </div>
          <div className="mt-1 text-sm font-bold text-emerald-700">
            {correctAnswerDisplay}
          </div>
        </div>
      </div>

      <p className="mt-3 text-xs text-slate-600">
        <span className="font-semibold text-slate-500">說明：</span>
        {explanation}
      </p>
    </li>
  );
}

type ResultViewProps = {
  questions: ExamQuestion[];
  answers: Record<string, string>;
  onRestart: () => void;
  onStartRetry: (ids: string[]) => void;
};

function ResultView({
  questions,
  answers,
  onRestart,
  onStartRetry,
}: ResultViewProps) {
  const [detailFilter, setDetailFilter] = useState<DetailFilter>("all");

  // 一次計算每題狀態，後續四個 count 與 filter 共用
  const statuses = questions.map((q, i) => ({
    question: q,
    index: i,
    status: getQuestionStatus(q, answers[q.id]),
  }));

  const total = questions.length;
  const correctCount = statuses.filter((s) => s.status === "correct").length;
  const incorrectCount = statuses.filter(
    (s) => s.status === "incorrect",
  ).length;
  const unansweredCount = statuses.filter(
    (s) => s.status === "unanswered",
  ).length;
  const answeredCount = total - unansweredCount;
  const reviewCount = incorrectCount + unansweredCount;

  const filterCounts: Record<DetailFilter, number> = {
    all: total,
    incorrect: incorrectCount,
    unanswered: unansweredCount,
    review: reviewCount,
  };

  const filteredStatuses = statuses.filter((s) => {
    if (detailFilter === "all") return true;
    if (detailFilter === "incorrect") return s.status === "incorrect";
    if (detailFilter === "unanswered") return s.status === "unanswered";
    return s.status === "incorrect" || s.status === "unanswered"; // review
  });

  const ratio = total === 0 ? 0 : correctCount / total;
  let cheer = "你好棒！繼續加油喔！";
  if (ratio === 1) cheer = "全部答對！太厲害了！🎉";
  else if (ratio >= 0.7) cheer = "答對好多題，超棒的！";
  else if (ratio >= 0.4) cheer = "做得不錯，再多練幾次會更厲害！";
  else cheer = "沒關係，再試一次一定會更好！";

  return (
    <article className="rounded-3xl bg-white p-8 shadow-md ring-1 ring-emerald-100 sm:p-10">
      <div className="text-center">
        <div className="text-6xl" aria-hidden>
          🎉
        </div>
        <h2 className="mt-4 text-3xl font-black text-emerald-600 sm:text-4xl">
          完成了！
        </h2>
        <p className="mt-3 text-2xl font-bold text-slate-900 sm:text-3xl">
          答對 {correctCount} / {total} 題
        </p>
        <dl className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
          <div className="rounded-2xl bg-emerald-50 px-4 py-3 text-center ring-1 ring-emerald-100">
            <dt className="text-xs font-semibold text-emerald-700">已作答</dt>
            <dd className="mt-1 text-xl font-black text-emerald-700">
              {answeredCount} / {total}
            </dd>
          </div>
          <div className="rounded-2xl bg-rose-50 px-4 py-3 text-center ring-1 ring-rose-100">
            <dt className="text-xs font-semibold text-rose-600">未作答</dt>
            <dd className="mt-1 text-xl font-black text-rose-600">
              {unansweredCount} 題
            </dd>
          </div>
        </dl>
        {unansweredCount > 0 && (
          <p className="mt-3 text-xs text-slate-400">
            未作答的題目算錯；下次可以再試試看～
          </p>
        )}
        <p className="mt-4 text-base text-slate-600 sm:text-lg">{cheer}</p>
      </div>

      <section className="mt-8" aria-label="每題詳解">
        <h3 className="mb-3 text-center text-base font-bold text-slate-700 sm:text-lg">
          每題詳解
        </h3>

        <div
          className="mb-4 flex flex-wrap items-center justify-center gap-2"
          role="group"
          aria-label="詳解篩選"
        >
          {FILTER_ORDER.map((key) => {
            const selected = key === detailFilter;
            return (
              <button
                key={key}
                type="button"
                onClick={() => setDetailFilter(key)}
                aria-pressed={selected}
                className={
                  "flex min-h-10 items-center gap-2 rounded-full px-4 py-1.5 text-xs font-bold shadow-sm transition focus:outline-none focus-visible:ring-4 focus-visible:ring-amber-200 sm:text-sm " +
                  (selected
                    ? "bg-amber-300 text-slate-900 ring-2 ring-amber-400"
                    : "bg-white text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50")
                }
              >
                <span>{FILTER_LABELS[key]}</span>
                <span
                  className={
                    "inline-flex min-w-6 items-center justify-center rounded-full px-2 text-[11px] font-black " +
                    (selected
                      ? "bg-amber-100 text-amber-800"
                      : "bg-slate-100 text-slate-600")
                  }
                >
                  {filterCounts[key]}
                </span>
              </button>
            );
          })}
        </div>

        {filteredStatuses.length === 0 ? (
          <div className="rounded-2xl bg-emerald-50 p-6 text-center text-sm font-bold text-emerald-700 ring-1 ring-emerald-200">
            {EMPTY_STATE_MESSAGES[detailFilter]}
          </div>
        ) : (
          <ul className="space-y-3">
            {filteredStatuses.map(({ question, index }) => (
              <QuestionDetailCard
                key={question.id}
                question={question}
                index={index}
                userAnswer={answers[question.id]}
              />
            ))}
          </ul>
        )}
      </section>

      {reviewCount > 0 && (
        <div className="mt-6 flex justify-center">
          <button
            type="button"
            onClick={() =>
              onStartRetry(
                statuses
                  .filter(
                    (s) =>
                      s.status === "incorrect" || s.status === "unanswered",
                  )
                  .map((s) => s.question.id),
              )
            }
            className="flex min-h-14 items-center gap-2 rounded-full bg-rose-400 px-7 py-3 text-base font-bold text-white shadow-md transition hover:bg-rose-500 focus:outline-none focus-visible:ring-4 focus-visible:ring-rose-200 sm:text-lg"
          >
            <span aria-hidden>🔁</span> 再練習這些題目（{reviewCount}）
          </button>
        </div>
      )}

      <div className="mt-6 flex flex-col items-center gap-3">
        <button
          type="button"
          onClick={onRestart}
          className="flex min-h-14 items-center gap-2 rounded-full bg-amber-400 px-8 py-3 text-lg font-bold text-white shadow-md transition hover:bg-amber-500 focus:outline-none focus-visible:ring-4 focus-visible:ring-amber-200"
        >
          <span aria-hidden>🔁</span> 重新測驗
        </button>
        <Link
          href="/"
          className="text-sm font-semibold text-slate-500 underline-offset-2 hover:text-slate-800 hover:underline"
        >
          回首頁
        </Link>
      </div>
    </article>
  );
}

// =============================================================
// 再練習結果頁（P3-6-B-4 第二刀）
// =============================================================

type RetryResultViewProps = {
  /** retry mode 中作答的題目（已 filter 為 incorrect + unanswered） */
  retryQuestions: ExamQuestion[];
  /** retry mode 的答案 map（與原始 session.answers 分開） */
  retryAnswers: Record<string, string>;
  /** 完整題庫，用於計算每題在原始試卷的 index（顯示「第 N 題」對齊整份試卷） */
  allQuestions: ExamQuestion[];
  onExitRetry: () => void;
  onRestart: () => void;
};

function RetryResultView({
  retryQuestions,
  retryAnswers,
  allQuestions,
  onExitRetry,
  onRestart,
}: RetryResultViewProps) {
  const total = retryQuestions.length;
  const correctCount = retryQuestions.filter((q) =>
    isCorrect(q, retryAnswers[q.id]),
  ).length;
  const answeredCount = retryQuestions.filter((q) =>
    isAnswered(retryAnswers[q.id]),
  ).length;
  const unansweredCount = total - answeredCount;
  const ratio = total === 0 ? 0 : correctCount / total;
  let cheer = "再練習也是進步！繼續加油！";
  if (ratio === 1) cheer = "全部答對！再練習超有成效！🎉";
  else if (ratio >= 0.7) cheer = "進步好多，超棒的！";
  else if (ratio >= 0.4) cheer = "比上次更熟悉了，再試一次會更好！";
  else cheer = "沒關係，多看幾次題目會更熟悉～";

  // 用原始題庫順序找出每題在整份試卷的 index（顯示「第 N 題」對齊整份試卷編號）
  const originalIndexById = new Map(allQuestions.map((q, i) => [q.id, i]));

  return (
    <article className="rounded-3xl bg-white p-8 shadow-md ring-1 ring-amber-100 sm:p-10">
      <div className="rounded-2xl bg-amber-50 px-4 py-3 text-center ring-1 ring-amber-200">
        <p className="text-sm font-bold text-amber-800">
          🔁 本次再練習結果
        </p>
        <p className="mt-1 text-xs text-amber-700">
          再練習結果<strong className="font-bold">不會覆蓋</strong>
          原始測驗分數；原始測驗結果仍保留，按下方「回到完整測驗結果」即可看到。
        </p>
      </div>

      <div className="mt-6 text-center">
        <div className="text-5xl" aria-hidden>
          🌱
        </div>
        <h2 className="mt-3 text-2xl font-black text-amber-700 sm:text-3xl">
          再練習完成！
        </h2>
        <p className="mt-3 text-2xl font-bold text-slate-900 sm:text-3xl">
          答對 {correctCount} / {total} 題
        </p>
        <dl className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
          <div className="rounded-2xl bg-emerald-50 px-4 py-3 text-center ring-1 ring-emerald-100">
            <dt className="text-xs font-semibold text-emerald-700">已作答</dt>
            <dd className="mt-1 text-xl font-black text-emerald-700">
              {answeredCount} / {total}
            </dd>
          </div>
          <div className="rounded-2xl bg-rose-50 px-4 py-3 text-center ring-1 ring-rose-100">
            <dt className="text-xs font-semibold text-rose-600">未作答</dt>
            <dd className="mt-1 text-xl font-black text-rose-600">
              {unansweredCount} 題
            </dd>
          </div>
        </dl>
        <p className="mt-4 text-base text-slate-600 sm:text-lg">{cheer}</p>
      </div>

      <section className="mt-8" aria-label="再練習每題詳解">
        <h3 className="mb-3 text-center text-base font-bold text-slate-700 sm:text-lg">
          再練習每題詳解
        </h3>
        <ul className="space-y-3">
          {retryQuestions.map((q) => (
            <QuestionDetailCard
              key={q.id}
              question={q}
              index={originalIndexById.get(q.id) ?? 0}
              userAnswer={retryAnswers[q.id]}
            />
          ))}
        </ul>
      </section>

      <div className="mt-8 flex flex-col items-center gap-3">
        <button
          type="button"
          onClick={onExitRetry}
          className="flex min-h-14 items-center gap-2 rounded-full bg-amber-400 px-8 py-3 text-lg font-bold text-white shadow-md transition hover:bg-amber-500 focus:outline-none focus-visible:ring-4 focus-visible:ring-amber-200"
        >
          <span aria-hidden>↩</span> 回到完整測驗結果
        </button>
        <button
          type="button"
          onClick={onRestart}
          className="flex min-h-12 items-center gap-2 rounded-full bg-white px-6 py-2 text-sm font-bold text-slate-600 shadow-sm ring-1 ring-slate-200 transition hover:bg-slate-50 focus:outline-none focus-visible:ring-4 focus-visible:ring-slate-200"
        >
          <span aria-hidden>🔁</span> 重新測驗（清除原始與再練習進度）
        </button>
        <Link
          href="/"
          className="text-sm font-semibold text-slate-500 underline-offset-2 hover:text-slate-800 hover:underline"
        >
          回首頁
        </Link>
      </div>
    </article>
  );
}

// =============================================================
// QuestionView：依題型分派
// =============================================================

type QuestionViewProps = {
  question: ExamQuestion;
  currentAnswer: string | undefined;
  onSelectAnswer: (value: string) => void;
};

function QuestionView({
  question,
  currentAnswer,
  onSelectAnswer,
}: QuestionViewProps) {
  switch (question.type) {
    case "multiple-choice":
      return (
        <MultipleChoiceView
          question={question}
          currentAnswer={currentAnswer}
          onSelectAnswer={onSelectAnswer}
        />
      );
    case "picture-choice":
      return (
        <PictureChoiceView
          question={question}
          currentAnswer={currentAnswer}
          onSelectAnswer={onSelectAnswer}
        />
      );
    case "word-choice":
      return (
        <WordChoiceView
          question={question}
          currentAnswer={currentAnswer}
          onSelectAnswer={onSelectAnswer}
        />
      );
    case "listening-choice":
      return (
        <ListeningChoiceView
          question={question}
          currentAnswer={currentAnswer}
          onSelectAnswer={onSelectAnswer}
        />
      );
    case "fill-blank":
      return (
        <FillBlankView
          question={question}
          currentAnswer={currentAnswer}
          onSelectAnswer={onSelectAnswer}
        />
      );
    case "matching":
      return (
        <MatchingView
          question={question}
          currentAnswer={currentAnswer}
          onSelectAnswer={onSelectAnswer}
        />
      );
  }
}

// =============================================================
// 共用小元件
// =============================================================

function PromptText({ prompt }: { prompt: string }) {
  return (
    <h2 className="mt-6 text-center text-2xl font-bold text-slate-900 sm:text-3xl">
      {prompt}
    </h2>
  );
}

type TextOptionButtonProps = {
  label: string;
  selected: boolean;
  onClick: () => void;
};

function TextOptionButton({ label, selected, onClick }: TextOptionButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={
        "flex min-h-16 w-full items-center justify-center rounded-2xl px-4 py-4 text-2xl font-bold shadow-sm transition focus:outline-none focus-visible:ring-4 focus-visible:ring-amber-200 " +
        (selected
          ? "bg-amber-300 text-slate-900 ring-2 ring-amber-400"
          : "bg-white text-slate-900 ring-1 ring-amber-100 hover:-translate-y-0.5 hover:ring-amber-300")
      }
    >
      {label}
    </button>
  );
}

type ImageOptionButtonProps = {
  option: ImageOption;
  selected: boolean;
  onClick: () => void;
};

function ImageOptionButton({
  option,
  selected,
  onClick,
}: ImageOptionButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      aria-label={`選項圖片：${option.value}`}
      className={
        "block w-full rounded-2xl p-2 shadow-sm transition focus:outline-none focus-visible:ring-4 focus-visible:ring-amber-200 " +
        (selected
          ? "bg-amber-100 ring-2 ring-amber-400"
          : "bg-white ring-1 ring-amber-100 hover:-translate-y-0.5 hover:ring-amber-300")
      }
    >
      <div className="flex aspect-square w-full items-center justify-center overflow-hidden rounded-xl bg-amber-50">
        <QuizImage
          src={option.image}
          alt={`${option.value} 的圖片`}
          fallbackInitial={option.value}
          size="sm"
        />
      </div>
    </button>
  );
}

// QuizImage：file-private 圖片 fallback（與 PracticeImage 同模式但獨立，避免動 P2-4C 元件）
type ImageStatus = "loading" | "ready" | "missing";

type QuizImageProps = {
  src?: string;
  alt: string;
  fallbackInitial?: string;
  size?: "lg" | "sm";
};

function QuizImage({
  src,
  alt,
  fallbackInitial = "?",
  size = "lg",
}: QuizImageProps) {
  const [imageStatus, setImageStatus] = useState<ImageStatus>(() =>
    src ? "loading" : "missing",
  );

  useEffect(() => {
    if (!src) return;
    let cancelled = false;
    const probe = new window.Image();
    probe.onload = () => {
      if (!cancelled) setImageStatus("ready");
    };
    probe.onerror = () => {
      if (!cancelled) setImageStatus("missing");
    };
    probe.src = src;
    return () => {
      cancelled = true;
      probe.onload = null;
      probe.onerror = null;
    };
  }, [src]);

  if (imageStatus === "ready" && src) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={src} alt={alt} className="h-full w-full object-contain" />
    );
  }

  const initial = fallbackInitial.charAt(0).toUpperCase();
  const initialClass =
    size === "lg"
      ? "text-6xl font-black sm:text-7xl"
      : "text-3xl font-black sm:text-4xl";
  const labelClass = size === "lg" ? "text-sm" : "text-xs";

  return (
    <div className="flex h-full w-full flex-col items-center justify-center gap-1 text-amber-700">
      <span className={initialClass}>{initial}</span>
      <span className={`${labelClass} text-amber-600`}>圖片準備中</span>
    </div>
  );
}

// =============================================================
// 6 題型 view
// =============================================================

type ViewProps<Q> = {
  question: Q;
  currentAnswer: string | undefined;
  onSelectAnswer: (value: string) => void;
};

function MultipleChoiceView({
  question,
  currentAnswer,
  onSelectAnswer,
}: ViewProps<ExamMultipleChoiceQuestion>) {
  return (
    <>
      <PromptText prompt={question.prompt} />
      <ul className="mt-6 grid gap-3 sm:grid-cols-2 sm:gap-4">
        {question.options.map((opt) => (
          <li key={opt}>
            <TextOptionButton
              label={opt}
              selected={currentAnswer === opt}
              onClick={() => onSelectAnswer(opt)}
            />
          </li>
        ))}
      </ul>
    </>
  );
}

function PictureChoiceView({
  question,
  currentAnswer,
  onSelectAnswer,
}: ViewProps<PictureChoiceQuestion>) {
  return (
    <>
      <div className="mt-4 flex aspect-square w-full items-center justify-center overflow-hidden rounded-2xl bg-amber-50">
        <QuizImage src={question.image} alt="題目圖片" size="lg" />
      </div>
      {question.prompt && <PromptText prompt={question.prompt} />}
      <ul className="mt-6 grid gap-3 sm:grid-cols-2 sm:gap-4">
        {question.options.map((opt) => (
          <li key={opt}>
            <TextOptionButton
              label={opt}
              selected={currentAnswer === opt}
              onClick={() => onSelectAnswer(opt)}
            />
          </li>
        ))}
      </ul>
    </>
  );
}

function WordChoiceView({
  question,
  currentAnswer,
  onSelectAnswer,
}: ViewProps<WordChoiceQuestion>) {
  return (
    <>
      <div className="mt-4 flex flex-col items-center justify-center gap-3 rounded-2xl bg-sky-50 px-6 py-10">
        <span className="text-xs font-semibold tracking-wider text-sky-600">
          這個英文單字是…
        </span>
        <span className="text-5xl font-black tracking-tight text-slate-900 sm:text-6xl">
          {question.prompt}
        </span>
      </div>
      <ul className="mt-6 grid grid-cols-2 gap-3 sm:gap-4">
        {question.options.map((opt) => (
          <li key={opt.value}>
            <ImageOptionButton
              option={opt}
              selected={currentAnswer === opt.value}
              onClick={() => onSelectAnswer(opt.value)}
            />
          </li>
        ))}
      </ul>
    </>
  );
}

type AudioStatus = "loading" | "ready" | "missing";

function ListeningChoiceView({
  question,
  currentAnswer,
  onSelectAnswer,
}: ViewProps<ListeningChoiceQuestion>) {
  // P3-9-C 第一刀：audioSrc 存在則顯示 audio player；載入失敗或缺值時 fallback 到 transcript / ttsScript 文字
  const audioSrc = question.audioSrc;
  const transcriptText =
    question.transcript ?? question.ttsScript ?? "（音檔準備中）";
  const isImage = question.optionType === "image";

  const [audioStatus, setAudioStatus] = useState<AudioStatus>(() =>
    audioSrc ? "loading" : "missing",
  );

  const showAudioPlayer = audioStatus !== "missing" && Boolean(audioSrc);
  const showFallbackHint = audioStatus === "missing";

  return (
    <>
      <div className="mt-4 flex flex-col items-center justify-center gap-2 rounded-2xl bg-sky-50 px-6 py-6">
        <span className="text-3xl" aria-hidden>
          🔊
        </span>
        <span className="text-xs font-semibold tracking-wider text-sky-600">
          聽聽看
        </span>

        {showAudioPlayer && audioSrc && (
          <>
            <audio
              controls
              src={audioSrc}
              onCanPlay={() => setAudioStatus("ready")}
              onError={() => setAudioStatus("missing")}
              aria-label="題目音檔（可重播）"
              className="mt-1 w-full max-w-sm"
            >
              你的瀏覽器不支援音檔播放，請看下方文字。
            </audio>
            <p className="mt-1 text-[11px] text-sky-600 sm:text-xs">
              💡 正式考試中錄音會播放兩次；本練習版可自行重播音檔練習。
            </p>
          </>
        )}

        {showFallbackHint && (
          <p className="mt-1 text-xs font-semibold text-amber-700">
            音檔準備中，先用文字練習
          </p>
        )}

        <p className="mt-2 text-center text-lg font-bold text-slate-800 sm:text-xl">
          {transcriptText}
        </p>
      </div>

      {isImage ? (
        <ul className="mt-6 grid grid-cols-2 gap-3 sm:gap-4">
          {(question.options as ImageOption[]).map((opt) => (
            <li key={opt.value}>
              <ImageOptionButton
                option={opt}
                selected={currentAnswer === opt.value}
                onClick={() => onSelectAnswer(opt.value)}
              />
            </li>
          ))}
        </ul>
      ) : (
        <ul className="mt-6 grid gap-3 sm:grid-cols-2 sm:gap-4">
          {(question.options as string[]).map((opt) => (
            <li key={opt}>
              <TextOptionButton
                label={opt}
                selected={currentAnswer === opt}
                onClick={() => onSelectAnswer(opt)}
              />
            </li>
          ))}
        </ul>
      )}
    </>
  );
}

function FillBlankView({
  question,
  currentAnswer,
  onSelectAnswer,
}: ViewProps<FillBlankQuestion>) {
  const hasOptions =
    Array.isArray(question.options) && question.options.length > 0;

  return (
    <>
      <PromptText prompt={question.prompt} />

      {hasOptions ? (
        <ul className="mt-6 grid gap-3 sm:grid-cols-2 sm:gap-4">
          {question.options!.map((opt) => (
            <li key={opt}>
              <TextOptionButton
                label={opt}
                selected={currentAnswer === opt}
                onClick={() => onSelectAnswer(opt)}
              />
            </li>
          ))}
        </ul>
      ) : (
        <>
          <div className="mt-6 flex justify-center">
            <input
              type="text"
              value={currentAnswer ?? ""}
              onChange={(e) => onSelectAnswer(e.target.value)}
              placeholder="在這裡輸入答案…"
              aria-label="自由填空輸入框"
              className="w-full max-w-md rounded-2xl border-2 border-amber-200 bg-white px-5 py-4 text-center text-2xl font-bold text-slate-900 placeholder:text-slate-300 focus:border-amber-400 focus:outline-none focus:ring-4 focus:ring-amber-200"
            />
          </div>
          <p className="mt-2 text-center text-xs text-slate-400">
            提示：英文小寫即可，前後空白不計
          </p>
        </>
      )}
    </>
  );
}

function MatchingView({
  question,
  currentAnswer,
  onSelectAnswer,
}: ViewProps<MatchingQuestion>) {
  // 最小可玩：閱讀型——顯示 pairs，按「我看完了」算作答
  const done = currentAnswer === MATCHING_DONE_TOKEN;
  return (
    <>
      {question.prompt && <PromptText prompt={question.prompt} />}
      <p className="mt-2 text-center text-xs text-slate-400">
        （這題目前用閱讀型呈現；之後會加入拖曳配對）
      </p>
      <ul className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4">
        {question.pairs.map((pair, i) => (
          <li
            key={`${pair.left}-${i}`}
            className="flex items-center gap-3 rounded-2xl bg-white p-3 shadow-sm ring-1 ring-amber-100"
          >
            <span className="flex h-12 min-w-12 items-center justify-center rounded-xl bg-amber-50 px-3 text-lg font-bold text-slate-900">
              {pair.left}
            </span>
            <span aria-hidden className="text-amber-400">
              ←→
            </span>
            <div className="h-16 w-16 overflow-hidden rounded-xl bg-amber-50">
              <QuizImage
                src={pair.right}
                alt={`${pair.left} 的圖片`}
                fallbackInitial={pair.left}
                size="sm"
              />
            </div>
          </li>
        ))}
      </ul>
      <div className="mt-6 flex justify-center">
        <button
          type="button"
          onClick={() => onSelectAnswer(MATCHING_DONE_TOKEN)}
          aria-pressed={done}
          className={
            "flex min-h-14 items-center gap-2 rounded-full px-8 py-3 text-base font-bold shadow-sm transition focus:outline-none focus-visible:ring-4 focus-visible:ring-amber-200 " +
            (done
              ? "bg-emerald-300 text-slate-900 ring-2 ring-emerald-400"
              : "bg-white text-slate-700 ring-1 ring-amber-200 hover:bg-amber-50")
          }
        >
          {done ? "✓ 看完了" : "我看完了"}
        </button>
      </div>
    </>
  );
}
