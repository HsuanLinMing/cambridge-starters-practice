"use client";

import { useEffect, useRef, useState } from "react";
import type { VocabularyItem } from "@/lib/types";

type VocabularyCardProps = {
  item: VocabularyItem;
};

type ImageStatus = "loading" | "ready" | "missing";

export default function VocabularyCard({ item }: VocabularyCardProps) {
  const [imageStatus, setImageStatus] = useState<ImageStatus>(() =>
    item.image ? "loading" : "missing",
  );
  const [audioMessage, setAudioMessage] = useState<string | null>(null);
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
        <p className="mt-2 text-2xl font-semibold text-slate-700 sm:text-3xl">
          {item.translation}
        </p>
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

      <div className="mt-4 rounded-2xl bg-slate-50 p-4 text-center">
        <p className="text-lg font-medium text-slate-800 sm:text-xl">
          {item.exampleEn}
        </p>
        <p className="mt-1 text-base text-slate-600">{item.exampleZh}</p>
      </div>
    </article>
  );
}
