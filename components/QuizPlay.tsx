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

function getStarterPartInfo(question: ExamQuestion): StarterPartInfo {
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

  const handleRestart = () => {
    clearSession();
    setSession(createEmptySession(paperId, questions));
    setRestoredHint(false);
  };

  if (total === 0) {
    return (
      <div className="rounded-3xl bg-white p-8 text-center text-slate-500 shadow-sm">
        目前沒有題目，請稍後再來。
      </div>
    );
  }

  if (session.submitted) {
    const correctCount = questions.filter((q) =>
      isCorrect(q, session.answers[q.id]),
    ).length;
    const answeredCount = questions.filter((q) =>
      isAnswered(session.answers[q.id]),
    ).length;
    return (
      <ResultView
        total={total}
        correctCount={correctCount}
        answeredCount={answeredCount}
        onRestart={handleRestart}
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

type ResultViewProps = {
  total: number;
  correctCount: number;
  answeredCount: number;
  onRestart: () => void;
};

function ResultView({
  total,
  correctCount,
  answeredCount,
  onRestart,
}: ResultViewProps) {
  const unansweredCount = total - answeredCount;
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

      <div className="mt-8 flex flex-col items-center gap-3">
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

function ListeningChoiceView({
  question,
  currentAnswer,
  onSelectAnswer,
}: ViewProps<ListeningChoiceQuestion>) {
  // 最小可玩：先顯示 transcript / ttsScript 文字，不播放音檔（音檔自製屬 P2-4C-2B-2 範圍）
  const text =
    question.transcript ?? question.ttsScript ?? "（音檔準備中）";
  const isImage = question.optionType === "image";

  return (
    <>
      <div className="mt-4 flex flex-col items-center justify-center gap-3 rounded-2xl bg-sky-50 px-6 py-8">
        <span className="text-3xl" aria-hidden>
          🔊
        </span>
        <span className="text-xs font-semibold tracking-wider text-sky-600">
          聽聽看（音檔準備中，先看文字）
        </span>
        <p className="text-center text-lg font-bold text-slate-800 sm:text-xl">
          {text}
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
