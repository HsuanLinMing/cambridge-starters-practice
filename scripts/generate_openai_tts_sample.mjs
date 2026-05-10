#!/usr/bin/env node
/**
 * scripts/generate_openai_tts_sample.mjs
 *
 * P3-9-C / P2-4C-2B-2 第二階段：OpenAI TTS examiner voice 試產腳本（一題版）。
 *
 * 用途：
 *   - 把 q-lc-001 的 transcript（"What does the boy want?"）透過 OpenAI TTS API
 *     產生「Cambridge-style young learners examiner」音色版本，放到
 *     `public/audio/starters/l3/q-lc-001-openai.mp3`，與既有 macOS `say` 版本
 *     `q-lc-001.m4a` **並存**——使用者實聽比較後再決定是否切換 audioSrc。
 *
 * 硬邊界（對齊 docs/TTS_AUDIO_WORKFLOW.md「第二階段」段）：
 *   - ❌ 不批次、不大量產生（本腳本只處理一題、固定文字）。
 *   - ❌ 不下載官方音檔；輸入文字是本專案自製 transcript。
 *   - ❌ 不覆蓋既有 `q-lc-001.m4a`（macOS say 版本）；輸出檔名不同。
 *   - ❌ 不修改 `data/p3-example-questions.json`（audioSrc 切換屬下一輪）。
 *   - ❌ 不寫入任何 API key（讀環境變數即用即丟）。
 *   - ✅ TTS voice 是 AI-generated，不是真人考官聲音——產生後需人工實聽確認。
 *
 * 使用方式：
 *   1. 把 OpenAI API key 寫進 `.env.local`（已被 .gitignore 排除）：
 *        OPENAI_API_KEY=sk-...
 *   2. 載入環境變數後跑腳本：
 *        node --env-file=.env.local scripts/generate_openai_tts_sample.mjs
 *      （Node 20.6+ 支援 --env-file；舊版可用：
 *        OPENAI_API_KEY=sk-... node scripts/generate_openai_tts_sample.mjs）
 *   3. 若無 OPENAI_API_KEY，腳本會印提示並安全退出（exit 0），不視為錯誤。
 *
 * 不需要安裝任何依賴——使用 Node 內建 fetch（Node 18+ 支援）。
 */

import { writeFile, access, mkdir } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

// =============================================================
// 設定（一題版，固定值）
// =============================================================

const TEXT = "What does the boy want?";
const OUTPUT_REL_PATH = "public/audio/starters/l3/q-lc-001-openai.mp3";

const MODEL = "gpt-4o-mini-tts";
const VOICE = process.env.OPENAI_TTS_VOICE ?? "alloy";

/**
 * Examiner 音色 instructions（送給 OpenAI TTS）。
 * 對齊本任務目標：Cambridge-style young learners examiner，清楚、平穩、溫和、
 * 偏標準英語、語速略慢適合 6 歲、不卡通、不像故事旁白、不自行加字。
 */
const INSTRUCTIONS = [
  "Speak like a calm Cambridge-style young learners English examiner.",
  "Use clear standard British English pronunciation.",
  "Speak slowly and clearly for a 6-year-old child.",
  "Tone: warm, neutral, professional, not cartoonish.",
  "Do not sound like a storyteller.",
  "Do not add extra words.",
  "Read only the given text exactly as written.",
].join(" ");

const RESPONSE_FORMAT = "mp3";

// =============================================================
// 主流程
// =============================================================

async function main() {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    console.log("");
    console.log("⚠️  未設定 OPENAI_API_KEY 環境變數，跳過試產（這不是錯誤）。");
    console.log("");
    console.log("   設定方式：");
    console.log("   1. 把 .env.example 複製為 .env.local（已被 .gitignore 排除）。");
    console.log("   2. 編輯 .env.local 填入 OPENAI_API_KEY=sk-...");
    console.log("   3. 跑：node --env-file=.env.local scripts/generate_openai_tts_sample.mjs");
    console.log("      或：OPENAI_API_KEY=sk-... node scripts/generate_openai_tts_sample.mjs");
    console.log("");
    process.exit(0);
  }

  const __filename = fileURLToPath(import.meta.url);
  const projectRoot = resolve(dirname(__filename), "..");
  const outputAbsPath = resolve(projectRoot, OUTPUT_REL_PATH);

  // 安全檢查：避免覆蓋既有 macOS say 版本
  const existingMacSayPath = resolve(
    projectRoot,
    "public/audio/starters/l3/q-lc-001.m4a",
  );
  if (outputAbsPath === existingMacSayPath) {
    console.error(
      "❌ 輸出路徑與既有 macOS say 版本相同，拒絕覆蓋；改 OUTPUT_REL_PATH。",
    );
    process.exit(1);
  }

  // 若 OpenAI 版本已存在，提示並中止（避免不慎覆蓋已實聽過的版本）
  try {
    await access(outputAbsPath);
    console.error(
      `⚠️  ${OUTPUT_REL_PATH} 已存在；若要重新產生，請先手動刪除既有檔案。`,
    );
    process.exit(1);
  } catch {
    // 檔案不存在，繼續
  }

  console.log("🎤 OpenAI TTS examiner voice 試產（一題版）");
  console.log(`   模型：${MODEL}`);
  console.log(`   voice：${VOICE}`);
  console.log(`   文字：${TEXT}`);
  console.log(`   輸出：${OUTPUT_REL_PATH}`);
  console.log("");
  console.log("   呼叫 OpenAI Audio Speech API…");

  const response = await fetch("https://api.openai.com/v1/audio/speech", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: MODEL,
      voice: VOICE,
      input: TEXT,
      instructions: INSTRUCTIONS,
      response_format: RESPONSE_FORMAT,
    }),
  });

  if (!response.ok) {
    const errText = await response.text().catch(() => "(unable to read body)");
    console.error(
      `❌ OpenAI API 呼叫失敗：HTTP ${response.status} ${response.statusText}`,
    );
    console.error(`   回應：${errText.slice(0, 500)}`);
    process.exit(1);
  }

  const audioBuffer = Buffer.from(await response.arrayBuffer());

  // 確保目錄存在
  await mkdir(dirname(outputAbsPath), { recursive: true });
  await writeFile(outputAbsPath, audioBuffer);

  console.log("");
  console.log(`✅ 試產完成：${OUTPUT_REL_PATH}`);
  console.log(`   檔案大小：${audioBuffer.length} bytes`);
  console.log("");
  console.log("📋 下一步（人工實聽確認）：");
  console.log(`   1. afplay ${OUTPUT_REL_PATH}    # macOS 直接播放`);
  console.log("   2. 確認發音清楚 / 語速適合小一 / 音色像考試員 / 沒有多念字");
  console.log("   3. 若通過，在下一輪任務中切換 q-lc-001 的 audioSrc 到此檔");
  console.log("");
  console.log("⚠️  TTS voice 是 AI-generated，不是真人考官聲音——使用時請於 UI 標示。");
}

main().catch((err) => {
  console.error("❌ 試產失敗：", err);
  process.exit(1);
});
