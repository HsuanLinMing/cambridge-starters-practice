"use client";

import { useEffect, useState } from "react";
import type { VocabularyItem } from "@/lib/types";

type ImageStatus = "loading" | "ready" | "missing";

type PracticeMode = "image-to-word" | "word-to-image";

type BuiltOptions = {
  options: VocabularyItem[];
  correctSlot: number;
};

/**
 * Deterministic 選項生成（兩種題型共用）：
 * - 正確答案 = vocabulary[index]
 * - 3 個干擾 = vocabulary 後續 3 筆，超過範圍循環
 * - 正確答案位置 = index % 4，使每題位置輪替但 server / client 一致
 */
function buildOptions(
  vocabulary: VocabularyItem[],
  index: number,
): BuiltOptions {
  const len = vocabulary.length;
  const correct = vocabulary[index];
  const distractors = [
    vocabulary[(index + 1) % len],
    vocabulary[(index + 2) % len],
    vocabulary[(index + 3) % len],
  ];
  const correctSlot = index % 4;
  const ordered: VocabularyItem[] = [...distractors];
  ordered.splice(correctSlot, 0, correct);
  return { options: ordered, correctSlot };
}

type PicturePracticeProps = {
  vocabulary: VocabularyItem[];
};

export default function PicturePractice({ vocabulary }: PicturePracticeProps) {
  const [mode, setMode] = useState<PracticeMode>("image-to-word");
  const [index, setIndex] = useState(0);
  const total = vocabulary.length;

  if (total === 0) {
    return (
      <div className="rounded-3xl bg-white p-8 text-center text-slate-500 shadow-sm">
        目前還沒有單字，請稍後再來。
      </div>
    );
  }

  const handleNext = () => {
    setIndex((i) => (i + 1) % total);
  };

  const handleModeChange = (newMode: PracticeMode) => {
    if (newMode === mode) return;
    setMode(newMode);
    setIndex(0);
  };

  return (
    <div className="flex flex-col gap-4">
      <ModeSwitch mode={mode} onChange={handleModeChange} />

      {mode === "image-to-word" ? (
        <ImageToWordQuestion
          key={index}
          vocabulary={vocabulary}
          index={index}
          total={total}
          onNext={handleNext}
        />
      ) : (
        <WordToImageQuestion
          key={index}
          vocabulary={vocabulary}
          index={index}
          total={total}
          onNext={handleNext}
        />
      )}
    </div>
  );
}

type ModeSwitchProps = {
  mode: PracticeMode;
  onChange: (m: PracticeMode) => void;
};

function ModeSwitch({ mode, onChange }: ModeSwitchProps) {
  const items: Array<{ value: PracticeMode; label: string }> = [
    { value: "image-to-word", label: "看圖選字" },
    { value: "word-to-image", label: "看字選圖" },
  ];

  return (
    <div
      role="tablist"
      aria-label="題型切換"
      className="flex gap-2 rounded-full bg-slate-100 p-1.5"
    >
      {items.map(({ value, label }) => {
        const active = value === mode;
        return (
          <button
            key={value}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(value)}
            className={
              "flex min-h-12 flex-1 items-center justify-center rounded-full px-4 py-2 text-base font-bold transition focus:outline-none focus-visible:ring-4 focus-visible:ring-amber-200 sm:text-lg " +
              (active
                ? "bg-amber-300 text-slate-900 shadow"
                : "text-slate-600 hover:bg-white")
            }
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}

type QuestionProps = {
  vocabulary: VocabularyItem[];
  index: number;
  total: number;
  onNext: () => void;
};

function ImageToWordQuestion({
  vocabulary,
  index,
  total,
  onNext,
}: QuestionProps) {
  const current = vocabulary[index];
  const { options, correctSlot } = buildOptions(vocabulary, index);
  const [selectedSlot, setSelectedSlot] = useState<number | null>(null);

  const answered = selectedSlot !== null;
  const isCorrect = answered && selectedSlot === correctSlot;

  return (
    <article className="rounded-3xl bg-white p-6 shadow-md ring-1 ring-amber-100 sm:p-8">
      <div className="text-center text-sm font-semibold text-slate-500">
        第 {index + 1} 題 / 共 {total} 題
      </div>

      <div className="mt-4 flex aspect-square w-full items-center justify-center overflow-hidden rounded-2xl bg-amber-50">
        <PracticeImage item={current} alt="看看這張圖片" size="lg" />
      </div>

      <h2 className="mt-6 text-center text-xl font-bold text-slate-900 sm:text-2xl">
        看看圖片，選出正確的英文單字！
      </h2>

      <ul className="mt-6 grid gap-3 sm:grid-cols-2 sm:gap-4">
        {options.map((opt, i) => {
          const isThis = selectedSlot === i;
          const isThisCorrect = i === correctSlot;
          let style =
            "bg-white text-slate-900 ring-1 ring-amber-100 hover:-translate-y-0.5 hover:ring-amber-300";
          if (answered) {
            if (isThisCorrect) {
              style = "bg-emerald-50 text-slate-900 ring-2 ring-emerald-400";
            } else if (isThis) {
              style = "bg-rose-50 text-slate-900 ring-2 ring-rose-400";
            } else {
              style = "bg-slate-50 text-slate-400 ring-1 ring-slate-200";
            }
          }
          return (
            <li key={opt.id}>
              <button
                type="button"
                disabled={answered}
                onClick={() => setSelectedSlot(i)}
                aria-label={`選項：${opt.word}`}
                className={
                  "flex min-h-16 w-full items-center justify-center rounded-2xl px-4 py-4 text-2xl font-bold shadow-sm transition focus:outline-none focus-visible:ring-4 focus-visible:ring-amber-200 disabled:cursor-default " +
                  style
                }
              >
                {opt.word}
              </button>
            </li>
          );
        })}
      </ul>

      <div className="mt-6 min-h-20 px-2 text-center" aria-live="polite">
        {answered && isCorrect && (
          <p className="text-xl font-bold text-emerald-600 sm:text-2xl">
            🎉 答對了！很棒！
          </p>
        )}
        {answered && !isCorrect && (
          <div className="text-base text-slate-700 sm:text-lg">
            <p className="font-bold text-rose-600">差一點點，正確答案是：</p>
            <p className="mt-1 text-2xl font-black text-slate-900 sm:text-3xl">
              {current.word}
            </p>
            <p className="mt-2 text-sm text-slate-500">沒關係，再試下一題！</p>
          </div>
        )}
      </div>

      <NextButton answered={answered} onNext={onNext} />
    </article>
  );
}

function WordToImageQuestion({
  vocabulary,
  index,
  total,
  onNext,
}: QuestionProps) {
  const current = vocabulary[index];
  const { options, correctSlot } = buildOptions(vocabulary, index);
  const [selectedSlot, setSelectedSlot] = useState<number | null>(null);

  const answered = selectedSlot !== null;
  const isCorrect = answered && selectedSlot === correctSlot;

  return (
    <article className="rounded-3xl bg-white p-6 shadow-md ring-1 ring-amber-100 sm:p-8">
      <div className="text-center text-sm font-semibold text-slate-500">
        第 {index + 1} 題 / 共 {total} 題
      </div>

      <div className="mt-4 flex flex-col items-center justify-center gap-3 rounded-2xl bg-sky-50 px-6 py-10">
        <span className="text-xs font-semibold tracking-wider text-sky-600">
          這個英文單字是…
        </span>
        <span className="text-5xl font-black tracking-tight text-slate-900 sm:text-6xl">
          {current.word}
        </span>
      </div>

      <h2 className="mt-6 text-center text-xl font-bold text-slate-900 sm:text-2xl">
        看看英文，選出正確的圖片！
      </h2>

      <ul className="mt-6 grid grid-cols-2 gap-3 sm:gap-4">
        {options.map((opt, i) => {
          const isThis = selectedSlot === i;
          const isThisCorrect = i === correctSlot;
          let style =
            "bg-white ring-1 ring-amber-100 hover:-translate-y-0.5 hover:ring-amber-300";
          if (answered) {
            if (isThisCorrect) {
              style = "bg-emerald-50 ring-2 ring-emerald-400";
            } else if (isThis) {
              style = "bg-rose-50 ring-2 ring-rose-400";
            } else {
              style = "bg-slate-50 ring-1 ring-slate-200 opacity-60";
            }
          }
          return (
            <li key={opt.id}>
              <button
                type="button"
                disabled={answered}
                onClick={() => setSelectedSlot(i)}
                aria-label={`選項圖片：${opt.word}`}
                className={
                  "block w-full rounded-2xl p-2 shadow-sm transition focus:outline-none focus-visible:ring-4 focus-visible:ring-amber-200 disabled:cursor-default " +
                  style
                }
              >
                <div className="flex aspect-square w-full items-center justify-center overflow-hidden rounded-xl bg-amber-50">
                  <PracticeImage
                    item={opt}
                    alt={`${opt.word} 的圖片`}
                    size="sm"
                  />
                </div>
              </button>
            </li>
          );
        })}
      </ul>

      <div className="mt-6 min-h-20 px-2 text-center" aria-live="polite">
        {answered && isCorrect && (
          <p className="text-xl font-bold text-emerald-600 sm:text-2xl">
            🎉 答對了！很棒！
          </p>
        )}
        {answered && !isCorrect && (
          <div className="text-base text-slate-700 sm:text-lg">
            <p className="font-bold text-rose-600">差一點點！</p>
            <p className="mt-1">
              正確答案是{" "}
              <strong className="text-2xl font-black text-slate-900 sm:text-3xl">
                {current.word}
              </strong>{" "}
              那張圖。
            </p>
            <p className="mt-2 text-sm text-slate-500">沒關係，再試下一題！</p>
          </div>
        )}
      </div>

      <NextButton answered={answered} onNext={onNext} />
    </article>
  );
}

type NextButtonProps = {
  answered: boolean;
  onNext: () => void;
};

function NextButton({ answered, onNext }: NextButtonProps) {
  return (
    <div className="mt-2 flex justify-center">
      <button
        type="button"
        disabled={!answered}
        onClick={onNext}
        className="flex min-h-14 items-center gap-2 rounded-full bg-amber-400 px-8 py-3 text-lg font-bold text-white shadow-md transition hover:bg-amber-500 focus:outline-none focus-visible:ring-4 focus-visible:ring-amber-200 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400 disabled:shadow-none"
      >
        下一題 <span aria-hidden>→</span>
      </button>
    </div>
  );
}

type PracticeImageProps = {
  item: VocabularyItem;
  alt: string;
  size?: "lg" | "sm";
};

function PracticeImage({ item, alt, size = "lg" }: PracticeImageProps) {
  const [imageStatus, setImageStatus] = useState<ImageStatus>(() =>
    item.image ? "loading" : "missing",
  );

  useEffect(() => {
    if (!item.image) return;
    let cancelled = false;
    const probe = new window.Image();
    probe.onload = () => {
      if (!cancelled) setImageStatus("ready");
    };
    probe.onerror = () => {
      if (!cancelled) setImageStatus("missing");
    };
    probe.src = item.image;
    return () => {
      cancelled = true;
      probe.onload = null;
      probe.onerror = null;
    };
  }, [item.image]);

  if (imageStatus === "ready" && item.image) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={item.image}
        alt={alt}
        className="h-full w-full object-contain"
      />
    );
  }

  const initial = item.word.charAt(0).toUpperCase();
  const initialClass =
    size === "lg"
      ? "text-7xl font-black sm:text-8xl"
      : "text-4xl font-black sm:text-5xl";
  const labelClass = size === "lg" ? "text-sm" : "text-xs";

  return (
    <div className="flex h-full w-full flex-col items-center justify-center gap-1 text-amber-700">
      <span className={initialClass}>{initial}</span>
      <span className={`${labelClass} text-amber-600`}>圖片準備中</span>
    </div>
  );
}
