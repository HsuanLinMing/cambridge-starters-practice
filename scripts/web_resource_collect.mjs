#!/usr/bin/env node
/**
 * scripts/web_resource_collect.mjs
 *
 * P3-10-B：Web resource collector / crawler 最小 CLI 原型（v0.1）。
 *
 * 對應 docs/WEB_RESOURCE_COLLECTOR_PLAN.md。
 *
 * 用途：
 *   - 把單一 URL 抓回來、做簡單 HTML 解析、輸出 resource-index 或 source-document JSON。
 *   - 屬 P3-10-B 範圍，本輪只實作 index-only 與 full-text 兩個模式；asset-aware 屬未來範圍。
 *
 * 硬邊界（對齊 docs/WEB_RESOURCE_COLLECTOR_PLAN.md A 段）：
 *   - ❌ 不爬蟲式批次抓——本 CLI 一次只處理一個 URL；無 spider / 無 follow-link。
 *   - ❌ 不繞 robots.txt——任何被 robots 禁止的 URL，使用者自行決定是否跑。
 *   - ❌ 不假裝 user agent——預設 UA 為 cambridge-starters-practice-collector/0.1。
 *   - ❌ 不下載圖片 / 音檔 / PDF（asset URL 只記錄、不下載）。
 *   - ❌ 不送 PII / 不帶 cookie / 不登入。
 *   - ❌ 不串 OpenAI / 雲端 API——純 fetch + regex。
 *
 * 使用方式：
 *   index-only：
 *     node scripts/web_resource_collect.mjs --mode index-only --url https://example.com
 *
 *   full-text：
 *     node scripts/web_resource_collect.mjs --mode full-text --url https://example.com \
 *       --source-type user_verified
 *
 * 輸出：
 *   index-only → data/imported/resource-index.generated.json
 *   full-text  → data/imported/source-document.generated.json
 *
 * 不需要安裝任何依賴——使用 Node 內建 fetch（Node 18+ 支援）。
 */

import { writeFile, mkdir } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const COLLECTOR_VERSION = "web_resource_collect.mjs@v0.1";
const COLLECTOR_USER_AGENT = "cambridge-starters-practice-collector/0.1";
const DEFAULT_TIMEOUT_MS = 15000;

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = join(__dirname, "..");
const DEFAULT_INDEX_OUT = join(
  REPO_ROOT,
  "data",
  "imported",
  "resource-index.generated.json",
);
const DEFAULT_DOC_OUT = join(
  REPO_ROOT,
  "data",
  "imported",
  "source-document.generated.json",
);

const HELP_TEXT = `\nweb_resource_collect.mjs — P3-10-B collector CLI v0.1\n
Usage:
  node scripts/web_resource_collect.mjs --mode <mode> --url <url> [options]

Modes:
  index-only  Fetch metadata only (title, description, h1, links count, resourceType)
  full-text   Fetch metadata + cleanedText + headings + links + assets + candidates

Options:
  --url <url>              Target URL (required)
  --source-type <type>     sourceType label: official | third_party | user_provided |
                           user_verified | ai_generated | custom | handmade | unknown
                           (default: unknown)
  --source-name <name>     Human-readable source name (default: <sourceDomain>)
  --out <path>             Override output path (default: data/imported/<mode>.generated.json)
  --timeout <ms>           Fetch timeout in milliseconds (default: 15000)
  --help                   Show this help

Examples:
  node scripts/web_resource_collect.mjs --mode index-only --url https://example.com
  node scripts/web_resource_collect.mjs --mode full-text --url https://example.com \\
    --source-type user_verified
`;

// ---------------------------------------------------------------------------
// CLI arg parsing
// ---------------------------------------------------------------------------

function parseArgs(argv) {
  const out = {
    mode: null,
    url: null,
    sourceType: "unknown",
    sourceName: null,
    out: null,
    timeout: DEFAULT_TIMEOUT_MS,
    help: false,
  };
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === "--help" || arg === "-h") {
      out.help = true;
    } else if (arg === "--mode") {
      out.mode = argv[++i];
    } else if (arg === "--url") {
      out.url = argv[++i];
    } else if (arg === "--source-type") {
      out.sourceType = argv[++i];
    } else if (arg === "--source-name") {
      out.sourceName = argv[++i];
    } else if (arg === "--out") {
      out.out = argv[++i];
    } else if (arg === "--timeout") {
      const n = Number(argv[++i]);
      if (!Number.isFinite(n) || n <= 0) {
        throw new Error(`Invalid --timeout value: ${argv[i]}`);
      }
      out.timeout = n;
    } else {
      throw new Error(`Unknown argument: ${arg}`);
    }
  }
  return out;
}

const ALLOWED_SOURCE_TYPES = new Set([
  "official",
  "third_party",
  "user_provided",
  "user_verified",
  "ai_generated",
  "custom",
  "handmade",
  "unknown",
]);

function validateArgs(args) {
  if (args.help) return;
  if (args.mode !== "index-only" && args.mode !== "full-text") {
    throw new Error(
      `--mode must be 'index-only' or 'full-text' (got: ${args.mode ?? "null"})`,
    );
  }
  if (!args.url) {
    throw new Error("--url is required");
  }
  try {
    // 驗證 URL 格式（拋 throw 即代表非法）
    void new URL(args.url);
  } catch {
    throw new Error(`Invalid --url: ${args.url}`);
  }
  if (!ALLOWED_SOURCE_TYPES.has(args.sourceType)) {
    throw new Error(
      `--source-type must be one of: ${[...ALLOWED_SOURCE_TYPES].join(" / ")}`,
    );
  }
}

// ---------------------------------------------------------------------------
// Fetch
// ---------------------------------------------------------------------------

async function fetchUrl(url, timeoutMs) {
  const ac = new AbortController();
  const timer = setTimeout(() => ac.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      method: "GET",
      headers: { "user-agent": COLLECTOR_USER_AGENT, accept: "text/html,*/*" },
      redirect: "follow",
      signal: ac.signal,
    });
    const contentType = res.headers.get("content-type") ?? "";
    const text = await res.text();
    return { status: res.status, contentType, text };
  } finally {
    clearTimeout(timer);
  }
}

// ---------------------------------------------------------------------------
// HTML 解析（簡單 regex / 字串處理，不依賴第三方 parser）
// ---------------------------------------------------------------------------

function stripTag(html, tagName) {
  const re = new RegExp(`<${tagName}\\b[^>]*>[\\s\\S]*?<\\/${tagName}>`, "gi");
  return html.replace(re, " ");
}

function extractTagContent(html, tagName) {
  const re = new RegExp(`<${tagName}\\b[^>]*>([\\s\\S]*?)<\\/${tagName}>`, "i");
  const m = re.exec(html);
  return m ? decodeEntities(stripAllTags(m[1])).trim() : "";
}

function extractMetaContent(html, name) {
  const re = new RegExp(
    `<meta[^>]+name=["']${name}["'][^>]*content=["']([^"']+)["']`,
    "i",
  );
  const m1 = re.exec(html);
  if (m1) return decodeEntities(m1[1]).trim();
  // try reversed attr order
  const re2 = new RegExp(
    `<meta[^>]+content=["']([^"']+)["'][^>]*name=["']${name}["']`,
    "i",
  );
  const m2 = re2.exec(html);
  return m2 ? decodeEntities(m2[1]).trim() : "";
}

function extractAllHeadings(html) {
  const out = [];
  const re = /<h([1-6])\b[^>]*>([\s\S]*?)<\/h\1>/gi;
  let m;
  while ((m = re.exec(html)) !== null) {
    const level = Number(m[1]);
    const text = decodeEntities(stripAllTags(m[2])).trim();
    if (text) out.push({ level, text });
  }
  return out;
}

function extractAllLinks(html, baseUrl, max = 50) {
  const out = [];
  const re = /<a\b[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi;
  let m;
  const seen = new Set();
  while ((m = re.exec(html)) !== null) {
    let href = m[1];
    try {
      href = new URL(href, baseUrl).toString();
    } catch {
      continue;
    }
    if (seen.has(href)) continue;
    seen.add(href);
    const text = decodeEntities(stripAllTags(m[2])).trim();
    out.push({ href, text });
    if (out.length >= max) break;
  }
  return out;
}

function extractAllAssets(html, baseUrl, max = 30) {
  const out = [];
  // img
  const imgRe = /<img\b[^>]*src=["']([^"']+)["'][^>]*?(?:alt=["']([^"']*)["'])?[^>]*>/gi;
  let m;
  while ((m = imgRe.exec(html)) !== null) {
    let url = m[1];
    try {
      url = new URL(url, baseUrl).toString();
    } catch {
      continue;
    }
    out.push({ type: "image", url, alt: m[2] ? decodeEntities(m[2]) : "" });
    if (out.length >= max) break;
  }
  // audio / video src
  const mediaRe = /<(audio|video)\b[^>]*src=["']([^"']+)["'][^>]*>/gi;
  while ((m = mediaRe.exec(html)) !== null) {
    let url = m[2];
    try {
      url = new URL(url, baseUrl).toString();
    } catch {
      continue;
    }
    out.push({ type: m[1].toLowerCase(), url, alt: "" });
    if (out.length >= max) break;
  }
  return out;
}

function stripAllTags(s) {
  return s.replace(/<[^>]+>/g, " ");
}

function decodeEntities(s) {
  return s
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/&#(\d+);/g, (_m, code) => String.fromCharCode(Number(code)));
}

function buildCleanedText(html) {
  let s = html;
  s = stripTag(s, "script");
  s = stripTag(s, "style");
  s = stripTag(s, "noscript");
  s = stripTag(s, "template");
  s = stripTag(s, "nav");
  s = stripTag(s, "footer");
  s = stripTag(s, "header");
  s = stripAllTags(s);
  s = decodeEntities(s);
  s = s.replace(/\s+/g, " ").trim();
  return s;
}

// ---------------------------------------------------------------------------
// resourceType 推斷（非常粗略；只給人類做 hint）
// ---------------------------------------------------------------------------

function inferResourceType(url, title, cleanedText) {
  const lowerUrl = url.toLowerCase();
  if (lowerUrl.endsWith(".pdf")) return "pdf_link";
  if (lowerUrl.includes("worksheet")) return "worksheet";
  if (lowerUrl.includes("sample") && lowerUrl.includes("paper")) {
    return "sample_paper";
  }
  if (lowerUrl.includes("youtube") || lowerUrl.includes("vimeo")) {
    return "video_page";
  }
  const lowerText = (title + " " + cleanedText).toLowerCase();
  if (
    lowerText.includes("vocabulary list") ||
    lowerText.includes("word list") ||
    lowerText.includes("wordlist")
  ) {
    return "vocabulary_list";
  }
  if (lowerText.includes("worksheet")) return "worksheet";
  if (lowerText.includes("sample paper") || lowerText.includes("mock test")) {
    return "sample_paper";
  }
  if (lowerText.length > 500) return "info_page";
  return "unknown";
}

// ---------------------------------------------------------------------------
// Candidate 偵測（簡單規則 v0.1）
// ---------------------------------------------------------------------------

function detectCandidates(cleanedText) {
  const out = [];
  if (!cleanedText) return out;
  const text = cleanedText;

  // 1. 看圖拼字提示（RW3）
  if (/look at the picture/i.test(text) && /write the word/i.test(text)) {
    out.push({
      candidateType: "instruction",
      text: "Look at the picture. Write the word.",
      likelyQuestionType: "spelling",
      likelyStarterPart: "RW3",
      confidence: 0.9,
      notes: "RW3 標準提示語",
    });
  }

  // 2. Yes / No 判斷句（RW1）
  if (
    /\b(yes\s*\/\s*no|yes or no|tick\s*✓|cross\s*✗)\b/i.test(text) ||
    /\bIt is a [a-z]+\.?/i.test(text)
  ) {
    out.push({
      candidateType: "instruction",
      text: "RW1 yes/no 判斷句相關段落",
      likelyQuestionType: "true-false",
      likelyStarterPart: "RW1",
      confidence: 0.6,
      notes: "偵測到 yes/no 判斷描述句樣式",
    });
  }

  // 3. 含 ____ 或 _ _ _ 的填空（RW3 / RW4）
  const blankMatches = text.match(/[^.!?]*_{2,}[^.!?]*[.!?]/g);
  if (blankMatches) {
    for (const block of blankMatches.slice(0, 5)) {
      out.push({
        candidateType: "question",
        text: block.trim(),
        likelyQuestionType: "fill-blank",
        likelyStarterPart: "RW4",
        confidence: 0.5,
        notes: "含底線填空，可能是 RW3 拼字或 RW4 填空（需人工確認）",
      });
    }
  }

  // 4. 編號題目開頭
  const numbered = text.match(/(?:^|\s)([1-9][0-9]?\s*[.)、]\s*[A-Z][^.?!]{4,80}[.?!])/g);
  if (numbered) {
    for (const block of numbered.slice(0, 5)) {
      const cleaned = block.trim();
      out.push({
        candidateType: "question",
        text: cleaned,
        likelyQuestionType: null,
        likelyStarterPart: null,
        confidence: 0.4,
        notes: "編號題目樣式，題型需人工或 normalizer 進一步判別",
      });
    }
  }

  // 5. vocabulary 樣式（逗號分隔的字母列表）
  const vocabRe = /\b([a-z]{2,10})(\s*,\s*[a-z]{2,10}){2,}/gi;
  let m;
  while ((m = vocabRe.exec(text)) !== null) {
    out.push({
      candidateType: "vocabulary",
      text: m[0],
      likelyQuestionType: null,
      likelyStarterPart: "RW3",
      confidence: 0.6,
      notes: "逗號分隔字彙清單樣式",
    });
    if (out.length > 30) break;
  }

  return out;
}

// ---------------------------------------------------------------------------
// 組裝 output payload
// ---------------------------------------------------------------------------

function buildResourceIndexEntry(args, fetched) {
  const urlObj = new URL(args.url);
  const title = extractTagContent(fetched.text, "title");
  const description = extractMetaContent(fetched.text, "description");
  const h1Match = /<h1\b[^>]*>([\s\S]*?)<\/h1>/i.exec(fetched.text);
  const h1 = h1Match
    ? decodeEntities(stripAllTags(h1Match[1])).trim()
    : "";
  const linksCount = (fetched.text.match(/<a\b/gi) ?? []).length;
  const cleanedText = buildCleanedText(fetched.text).slice(0, 2000);
  return {
    id: `res-gen-${Date.now()}`,
    url: args.url,
    title,
    sourceDomain: urlObj.hostname,
    sourceType: args.sourceType,
    sourceName: args.sourceName ?? urlObj.hostname,
    resourceType: inferResourceType(args.url, title, cleanedText),
    description,
    h1,
    linksCount,
    httpStatus: fetched.status,
    contentType: fetched.contentType,
    retrievedAt: new Date().toISOString(),
    collectorVersion: COLLECTOR_VERSION,
    notes: "由 web_resource_collect.mjs index-only 模式產生；單筆覆寫式輸出。",
  };
}

function buildSourceDocumentEntry(args, fetched) {
  const urlObj = new URL(args.url);
  const title = extractTagContent(fetched.text, "title");
  const description = extractMetaContent(fetched.text, "description");
  const headings = extractAllHeadings(fetched.text);
  const links = extractAllLinks(fetched.text, args.url);
  const assets = extractAllAssets(fetched.text, args.url);
  const cleanedText = buildCleanedText(fetched.text);
  const extractedCandidates = detectCandidates(cleanedText);
  return {
    id: `doc-gen-${Date.now()}`,
    resourceId: null,
    sourceUrl: args.url,
    sourceName: args.sourceName ?? urlObj.hostname,
    sourceType: args.sourceType,
    importedAt: new Date().toISOString(),
    contentType: fetched.contentType,
    httpStatus: fetched.status,
    title,
    description,
    headings,
    cleanedText: cleanedText.slice(0, 20000),
    cleanedTextLength: cleanedText.length,
    links,
    assets,
    extractedCandidates,
    provenance: {
      collectorVersion: COLLECTOR_VERSION,
      collectorMode: "full-text",
      fetcherUserAgent: COLLECTOR_USER_AGENT,
    },
    reviewStatus: "imported_raw",
  };
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  let args;
  try {
    args = parseArgs(process.argv.slice(2));
  } catch (err) {
    console.error(`Error: ${err.message}`);
    console.error(HELP_TEXT);
    process.exit(2);
  }
  if (args.help || process.argv.length <= 2) {
    console.log(HELP_TEXT);
    process.exit(args.help ? 0 : 2);
  }
  try {
    validateArgs(args);
  } catch (err) {
    console.error(`Error: ${err.message}`);
    process.exit(2);
  }

  console.error(
    `[collector] mode=${args.mode} url=${args.url} sourceType=${args.sourceType}`,
  );

  let fetched;
  try {
    fetched = await fetchUrl(args.url, args.timeout);
  } catch (err) {
    console.error(`[collector] fetch failed: ${err.message}`);
    process.exit(1);
  }
  console.error(
    `[collector] fetched status=${fetched.status} contentType=${fetched.contentType}`,
  );

  if (!fetched.contentType.includes("text") && !fetched.contentType.includes("html")) {
    console.error(
      `[collector] warning: non-HTML content-type (${fetched.contentType}); ` +
        "本 collector v0.1 只設計處理 HTML；其他格式（PDF / image / audio）屬未來 asset-aware 模式範圍。",
    );
  }

  const outPath =
    args.out ??
    (args.mode === "index-only" ? DEFAULT_INDEX_OUT : DEFAULT_DOC_OUT);

  await mkdir(dirname(outPath), { recursive: true });

  let payload;
  if (args.mode === "index-only") {
    const entry = buildResourceIndexEntry(args, fetched);
    payload = [entry];
    console.error(
      `[collector] index-only summary: title="${entry.title}" ` +
        `resourceType=${entry.resourceType} linksCount=${entry.linksCount}`,
    );
  } else {
    const entry = buildSourceDocumentEntry(args, fetched);
    payload = [entry];
    console.error(
      `[collector] full-text summary: title="${entry.title}" ` +
        `headings=${entry.headings.length} links=${entry.links.length} ` +
        `assets=${entry.assets.length} candidates=${entry.extractedCandidates.length} ` +
        `cleanedTextLength=${entry.cleanedTextLength}`,
    );
  }

  await writeFile(outPath, JSON.stringify(payload, null, 2) + "\n", "utf8");
  console.error(`[collector] wrote ${outPath}`);
}

main().catch((err) => {
  console.error(`[collector] unexpected error: ${err.stack ?? err.message}`);
  process.exit(1);
});
