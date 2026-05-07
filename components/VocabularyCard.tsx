"use client";

import { useEffect, useRef, useState } from "react";
import type { VocabularyItem } from "@/lib/types";

type VocabularyCardProps = {
  item: VocabularyItem;
  /**
   * revealMode 開啟時，初始隱藏中文翻譯與例句，
   * 由使用者點「看答案」按鈕後才顯示。預設 false（直接顯示全部，沿用 P2-1 行為）。
   */
  revealMode?: boolean;
};

type ImageStatus = "loading" | "ready" | "missing";

export default function VocabularyCard({
  item,
  revealMode = false,
}: VocabularyCardProps) {
  const [imageStatus, setImageStatus] = useState<ImageStatus>(() =>
    item.image ? "loading" : "missing",
  );
  const [audioMessage, setAudioMessage] = useState<string | null>(null);
  const [revealed, setRevealed] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

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

  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (!audioMessage) return;
    const timer = window.setTimeout(() => setAudioMessage(null), 2500);
    return () => window.clearTimeout(timer);
  }, [audioMessage]);

  const handlePlay = () => {
    if (!item.audio) {
      setAudioMessage("音檔準備中");
      return;
    }
    try {
      const audio = new Audio(item.audio);
      audioRef.current = audio;
      audio.addEventListener("error", () => setAudioMessage("音檔準備中"));
      const result = audio.play();
      if (result && typeof result.then === "function") {
        result.catch(() => setAudioMessage("音檔準備中"));
      }
      setAudioMessage("播放中…");
    } catch {
      setAudioMessage("音檔準備中");
    }
  };

  const initial = item.word.charAt(0).toUpperCase();
  const answerVisible = !revealMode || revealed;

  return (
    <article className="rounded-3xl bg-white p-6 shadow-md ring-1 ring-amber-100 sm:p-8">
      <div className="flex aspect-square w-full items-center justify-center overflow-hidden rounded-2xl bg-amber-50">
        {imageStatus === "ready" && item.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={item.image}
            alt={item.word}
            className="h-full w-full object-contain"
          />
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center gap-2 text-amber-700">
            <span className="text-7xl font-black sm:text-8xl">{initial}</span>
            <span className="text-sm text-amber-600">圖片準備中</span>
          </div>
        )}
      </div>

      <div className="mt-6 text-center">
        <h2 className="text-5xl font-black tracking-tight text-slate-900 sm:text-6xl">
          {item.word}
        </h2>
        {answerVisible ? (
          <p className="mt-2 text-2xl font-semibold text-slate-700 sm:text-3xl">
            {item.translation}
          </p>
        ) : (
          <p
            aria-hidden="true"
            className="mt-2 select-none text-2xl font-semibold text-transparent sm:text-3xl"
          >
            ？
          </p>
        )}
      </div>

      <div className="mt-6 flex justify-center">
        <button
          type="button"
          onClick={handlePlay}
          aria-label={`播放 ${item.word} 的發音`}
          className="flex min-h-16 items-center gap-3 rounded-full bg-sky-400 px-8 py-4 text-xl font-bold text-white shadow-lg transition hover:bg-sky-500 focus:outline-none focus-visible:ring-4 focus-visible:ring-sky-200"
        >
          <span className="text-2xl" aria-hidden>
            🔊
          </span>
          發音
        </button>
      </div>

      <div
        className="mt-3 h-6 text-center text-sm text-slate-500"
        aria-live="polite"
      >
        {audioMessage ?? ""}
      </div>

      {revealMode && (
        <div className="mt-4 flex justify-center">
          {revealed ? (
            <button
              type="button"
              onClick={() => setRevealed(false)}
              aria-label="收起答案"
              className="flex min-h-14 items-center gap-2 rounded-full bg-white px-7 py-3 text-lg font-bold text-slate-700 shadow-sm ring-1 ring-slate-200 transition hover:bg-slate-50 focus:outline-none focus-visible:ring-4 focus-visible:ring-slate-200"
            >
              <span aria-hidden>🙈</span> 再想一次
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setRevealed(true)}
              aria-label="顯示中文意思與例句"
              className="flex min-h-14 items-center gap-2 rounded-full bg-violet-400 px-7 py-3 text-lg font-bold text-white shadow-md transition hover:bg-violet-500 focus:outline-none focus-visible:ring-4 focus-visible:ring-violet-200"
            >
              <span aria-hidden>🔍</span> 看答案
            </button>
          )}
        </div>
      )}

      {answerVisible ? (
        <div className="mt-4 rounded-2xl bg-slate-50 p-4 text-center">
          <p className="text-lg font-medium text-slate-800 sm:text-xl">
            {item.exampleEn}
          </p>
          <p className="mt-1 text-base text-slate-600">{item.exampleZh}</p>
        </div>
      ) : (
        <div className="mt-4 rounded-2xl bg-slate-50 p-4 text-center text-slate-400">
          <p className="text-base">先想想看，再翻開答案吧！</p>
        </div>
      )}
    </article>
  );
}
