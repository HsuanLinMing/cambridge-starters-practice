#!/usr/bin/env node
/**
 * scripts/discover_resources.mjs
 *
 * P3-10-D-2 / P3-10-D-2B：Discovery crawler CLI（v0.2）。
 *
 * 對應 docs/DISCOVERY_CRAWLER_PLAN.md。
 *
 * 用途：
 *   - 讀 discovery-queries JSON + search-results JSON（manual-json / mock）
 *     或呼叫真實 search provider（brave-search）
 *   - normalize URL / 算 duplicateKey / 推 sourceType / resourceType / level / detectedExamParts
 *   - 算 score / reasons / shouldCollect / collectorMode
 *   - 寫出 discovered-resources.generated.json（必）+ search-results.generated.json（真實 provider）
 *
 * 版本歷史：
 *   v0.1（P3-10-D-2）：manual-json + mock；rule-based 分類；dedupe + scoring。
 *   v0.2（P3-10-D-2B）：新增 brave-search 真實 provider；provider adapter 化；
 *                       --query-file / --limit-per-query / --search-out / --query-limit；
 *                       無 API key 優雅 exit 2；每 query 之間有 delay；單 query 失敗不中斷整批。
 *
 * 硬邊界（對齊 docs/DISCOVERY_CRAWLER_PLAN.md D 段）：
 *   - ❌ 不下載圖片 / PDF / 音檔（discovery 階段只記 URL）
 *   - ❌ 不呼叫 OpenAI / 任何雲端 AI API
 *   - ❌ 不寫正式 data/p3-example-questions.json
 *   - ❌ 不直接爬 Google 搜尋結果頁
 *   - ❌ 不偽裝 user-agent / 不繞 captcha
 *   - ❌ 不自動 pipe 給 collector（屬 P3-10-D-3 範圍）
 *   - ❌ 不 follow discovered URL（discovery 自身不 fetch 候選 URL）
 *   - ✅ 真實 search provider 透過官方 search API；API key 從 env 讀，絕不 commit
 *
 * 使用方式：
 *   1) manual-json（離線模式 / 既有）：
 *     node scripts/discover_resources.mjs \
 *       --provider manual-json \
 *       --input data/imported/search-results.example.json \
 *       --queries data/imported/discovery-queries.example.json \
 *       --out data/imported/discovered-resources.generated.json
 *
 *   2) mock（測試模式 / 既有）：同 manual-json 流程，但 provider 標 mock。
 *
 *   3) brave-search（真實 provider / 本輪新增）：
 *     BRAVE_SEARCH_API_KEY=... \
 *     node scripts/discover_resources.mjs \
 *       --provider brave-search \
 *       --query-file data/imported/discovery-queries.example.json \
 *       --limit-per-query 5 \
 *       --search-out data/imported/search-results.generated.json \
 *       --out data/imported/discovered-resources.generated.json
 *
 * exit code：
 *   0  成功
 *   1  未預期錯誤
 *   2  CLI 參數錯 / 缺必填 / 讀檔失敗 / JSON parse 失敗 / 不支援的 provider / 缺 API key
 */

import { readFile, writeFile, mkdir } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

// ===========================================================================
// 0. 常數
// ===========================================================================

const DISCOVERY_VERSION = "discover_resources.mjs@v0.2";
const SUPPORTED_PROVIDERS = new Set(["manual-json", "mock", "brave-search"]);
const REAL_SEARCH_PROVIDERS = new Set(["brave-search"]);

// rate-limit / safety 預設（任務單規範）
const DEFAULT_LIMIT_PER_QUERY = 5;
const DEFAULT_QUERY_LIMIT = 20;
const BRAVE_MAX_COUNT = 20; // Brave Search API single-call cap
const INTER_QUERY_DELAY_MS = 500;
const FETCH_TIMEOUT_MS = 15000;

// Brave Search API
const BRAVE_ENDPOINT = "https://api.search.brave.com/res/v1/web/search";
const BRAVE_USER_AGENT = "cambridge-starters-practice-discovery/0.2";

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = join(__dirname, "..");
const DEFAULT_DISCOVERED_OUT = join(
  REPO_ROOT,
  "data",
  "imported",
  "discovered-resources.generated.json",
);

const HELP_TEXT = `\ndiscover_resources.mjs — P3-10-D-2 / P3-10-D-2B discovery CLI v0.2\n
Usage（兩種主要流程）：

  (A) Manual / offline 流程（既有；不上網）：
      node scripts/discover_resources.mjs --provider <manual-json|mock> \\
        --input <search-results.json> \\
        --queries <discovery-queries.json> \\
        [--out <discovered-resources.generated.json>]

  (B) 真實 search provider 流程（本輪新增 brave-search；要 API key）：
      BRAVE_SEARCH_API_KEY=... \\
      node scripts/discover_resources.mjs --provider brave-search \\
        --query-file <discovery-queries.json> \\
        [--limit-per-query 5] \\
        [--query-limit 20] \\
        [--search-out <search-results.generated.json>] \\
        [--out <discovered-resources.generated.json>]

Providers：
  manual-json      讀使用者整理好的 search results JSON（離線模式；本輪保留）
  mock             與 manual-json 同流程，作本機測試用（離線；本輪保留）
  brave-search     呼叫 Brave Search API；需 env BRAVE_SEARCH_API_KEY；本輪第一版

Options：
  --provider <provider>        必填；manual-json / mock / brave-search
  --input <path>               manual-json / mock 必填：search results JSON 路徑
  --queries <path>             manual-json / mock 必填：discovery queries JSON 路徑
  --query-file <path>          brave-search 必填：discovery queries JSON 路徑（亦可用 --queries）
  --limit-per-query <n>        brave-search 選填：每 query 最多取幾筆 search result（預設 ${DEFAULT_LIMIT_PER_QUERY}；Brave 上限 ${BRAVE_MAX_COUNT}）
  --query-limit <n>            brave-search 選填：本次最多跑幾條 query（預設 ${DEFAULT_QUERY_LIMIT}）
  --search-out <path>          brave-search 選填：search-results.generated.json 寫檔路徑
  --out <path>                 選填；discovered-resources 寫檔路徑（預設 data/imported/discovered-resources.generated.json）
  --help                       印此使用說明

Environment（不要 commit 真實 key；放 .env.local）：
  BRAVE_SEARCH_API_KEY         brave-search provider 必填；缺 key 時 exit 2

Future providers（本輪未實作；其值將以 exit 2 拒絕）：
  future-tavily                Tavily Search API（需 API key）
  future-bing-api              Bing Web Search v7（需 API key）
  future-google-cse            Google Programmable Search（需 API key + cx）
  future-serpapi               SerpAPI（付費，需 API key）

Rate limit / safety：
  - 每 query 之間預設 delay ${INTER_QUERY_DELAY_MS} ms（避免觸 provider rate limit）
  - 單一 query fetch / 解析失敗時印 error、繼續下一條（不中斷整批）；該 query 不會出現在 search-results 中
  - 預設 --query-limit ${DEFAULT_QUERY_LIMIT} 防呆，避免一次跑光 API quota

Examples：
  # 離線（manual-json）
  node scripts/discover_resources.mjs --provider manual-json \\
    --input data/imported/search-results.example.json \\
    --queries data/imported/discovery-queries.example.json \\
    --out data/imported/discovered-resources.generated.json

  # 真實 Brave Search（沒 key 則 exit 2 並印提示）
  BRAVE_SEARCH_API_KEY=xxxxxxxxxxxxxxxx \\
  node scripts/discover_resources.mjs --provider brave-search \\
    --query-file data/imported/discovery-queries.example.json \\
    --limit-per-query 2 \\
    --query-limit 2 \\
    --search-out data/imported/search-results.generated.json \\
    --out data/imported/discovered-resources.generated.json
`;

// ===========================================================================
// 1. CLI arg parsing
// ===========================================================================

function parseArgs(argv) {
  const out = {
    provider: null,
    input: null,
    queries: null,
    queryFile: null,
    limitPerQuery: null,
    queryLimit: null,
    searchOut: null,
    out: null,
    help: false,
  };
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === "--help" || arg === "-h") {
      out.help = true;
    } else if (arg === "--provider") {
      out.provider = argv[++i];
    } else if (arg === "--input") {
      out.input = argv[++i];
    } else if (arg === "--queries") {
      out.queries = argv[++i];
    } else if (arg === "--query-file") {
      out.queryFile = argv[++i];
    } else if (arg === "--limit-per-query") {
      const n = Number(argv[++i]);
      if (!Number.isInteger(n) || n <= 0) {
        throw new Error(`Invalid --limit-per-query: ${argv[i]}（必須正整數）`);
      }
      out.limitPerQuery = n;
    } else if (arg === "--query-limit") {
      const n = Number(argv[++i]);
      if (!Number.isInteger(n) || n <= 0) {
        throw new Error(`Invalid --query-limit: ${argv[i]}（必須正整數）`);
      }
      out.queryLimit = n;
    } else if (arg === "--search-out") {
      out.searchOut = argv[++i];
    } else if (arg === "--out") {
      out.out = argv[++i];
    } else {
      throw new Error(`Unknown argument: ${arg}`);
    }
  }
  return out;
}

function validateArgs(args) {
  if (args.help) return;
  if (!args.provider) {
    throw new Error("--provider is required（manual-json / mock / brave-search）");
  }
  if (!SUPPORTED_PROVIDERS.has(args.provider)) {
    const supported = [...SUPPORTED_PROVIDERS].join(" / ");
    throw new Error(
      `Provider "${args.provider}" 未支援。本輪只支援 ${supported}；其他 provider（future-tavily / future-bing-api / future-google-cse / future-serpapi）屬未來範圍。`,
    );
  }

  const queriesPath = args.queries ?? args.queryFile;

  if (args.provider === "manual-json" || args.provider === "mock") {
    if (!args.input) {
      throw new Error(
        `provider="${args.provider}" 必須提供 --input <search-results.json>`,
      );
    }
    if (!queriesPath) {
      throw new Error(
        `provider="${args.provider}" 必須提供 --queries 或 --query-file <discovery-queries.json>`,
      );
    }
  }

  if (args.provider === "brave-search") {
    if (!queriesPath) {
      throw new Error(
        "provider=brave-search 必須提供 --query-file <discovery-queries.json>（亦可用 --queries）",
      );
    }
    if (args.limitPerQuery && args.limitPerQuery > BRAVE_MAX_COUNT) {
      throw new Error(
        `--limit-per-query ${args.limitPerQuery} 超過 Brave Search single-call 上限 ${BRAVE_MAX_COUNT}`,
      );
    }
  }
}

// ===========================================================================
// 2. JSON 讀寫 helpers
// ===========================================================================

async function readJsonFile(path) {
  let raw;
  try {
    raw = await readFile(path, "utf8");
  } catch (err) {
    throw new Error(`讀檔失敗：${path}（${err.message}）`);
  }
  try {
    return JSON.parse(raw);
  } catch (err) {
    throw new Error(`JSON parse 失敗：${path}（${err.message}）`);
  }
}

async function writeJson(path, payload) {
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, JSON.stringify(payload, null, 2) + "\n", "utf8");
}

async function loadQueries(path) {
  const data = await readJsonFile(resolve(path));
  if (!Array.isArray(data)) {
    throw new Error(`--queries / --query-file JSON 必須是 array：${path}`);
  }
  return data;
}

async function loadManualSearchResults(path) {
  const data = await readJsonFile(resolve(path));
  if (!Array.isArray(data)) {
    throw new Error(
      `--input JSON 必須是 array（每筆 { queryId, query, results: [...] }）：${path}`,
    );
  }
  return data;
}

// ===========================================================================
// 3. URL normalization & duplicateKey
// ===========================================================================

const TRACKING_PARAM_RE = /^(utm_.*|gclid|fbclid|mc_.*|ref|ref_src|igshid)$/i;

function normalizeUrl(rawUrl) {
  let u;
  try {
    u = new URL(rawUrl);
  } catch {
    return null;
  }
  if (u.protocol === "http:") u.protocol = "https:";
  u.hash = "";
  const params = [...u.searchParams.entries()].filter(
    ([k]) => !TRACKING_PARAM_RE.test(k),
  );
  params.sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0));
  u.search = "";
  for (const [k, v] of params) u.searchParams.append(k, v);
  let path = u.pathname;
  if (path.length > 1 && path.endsWith("/")) {
    u.pathname = path.replace(/\/+$/, "");
  }
  return u.toString();
}

function buildDuplicateKey(normalizedUrl) {
  if (!normalizedUrl) return "";
  try {
    const u = new URL(normalizedUrl);
    let path = u.pathname;
    if (path.length > 1 && path.endsWith("/")) {
      path = path.replace(/\/+$/, "");
    }
    return `${u.protocol}//${u.hostname.toLowerCase()}${path.toLowerCase()}`;
  } catch {
    return normalizedUrl.toLowerCase();
  }
}

// ===========================================================================
// 4. 分類規則
// ===========================================================================

function getSourceType(domain) {
  const d = (domain ?? "").toLowerCase();
  if (
    d === "cambridgeenglish.org" ||
    d.endsWith(".cambridgeenglish.org") ||
    d === "cambridge.org" ||
    d.endsWith(".cambridge.org")
  ) {
    return "official";
  }
  const userVerifiedDomains = [
    "yle.tw",
    "www.yle.tw",
    "certificate.tw",
    "www.certificate.tw",
    "cambridgeesol.com.tw",
    "www.cambridgeesol.com.tw",
  ];
  if (userVerifiedDomains.includes(d)) {
    return "user_verified";
  }
  return "third_party";
}

const IMAGE_EXTS = [".png", ".jpg", ".jpeg", ".gif", ".svg", ".webp"];
const AUDIO_EXTS = [".mp3", ".m4a", ".wav", ".ogg"];
const VIDEO_HOSTS = [
  "youtube.com",
  "www.youtube.com",
  "youtu.be",
  "vimeo.com",
  "www.vimeo.com",
  "dailymotion.com",
];

function getResourceType(url, title, snippet) {
  const lowerUrl = (url ?? "").toLowerCase();
  const lowerTitle = (title ?? "").toLowerCase();
  const lowerSnippet = (snippet ?? "").toLowerCase();
  const combo = `${lowerTitle} ${lowerSnippet} ${lowerUrl}`;

  if (lowerUrl.endsWith(".pdf") || /\bpdf\b/i.test(`${title ?? ""} ${snippet ?? ""}`)) {
    return "pdf";
  }
  if (IMAGE_EXTS.some((ext) => lowerUrl.endsWith(ext))) return "image";
  if (AUDIO_EXTS.some((ext) => lowerUrl.endsWith(ext))) return "audio";
  try {
    const host = new URL(url).hostname.toLowerCase();
    if (VIDEO_HOSTS.includes(host)) return "video";
  } catch {
    /* skip */
  }
  if (lowerUrl.endsWith(".mp4")) return "video";

  if (
    combo.includes("sample paper") ||
    combo.includes("sample test") ||
    combo.includes("mock test") ||
    combo.includes("歷屆") ||
    combo.includes("歷屆試題")
  ) {
    return "sample_paper";
  }
  if (
    combo.includes("word list") ||
    combo.includes("vocabulary list") ||
    combo.includes("wordlist") ||
    combo.includes("單字表") ||
    combo.includes("字彙表")
  ) {
    return "vocabulary_list";
  }
  if (combo.includes("worksheet")) return "worksheet";
  if (
    combo.includes("listening practice") ||
    combo.includes("聽力練習") ||
    combo.includes("聽力測驗")
  ) {
    return "listening_practice";
  }
  if (
    combo.includes("reading writing practice") ||
    combo.includes("reading & writing") ||
    combo.includes("閱讀練習") ||
    combo.includes("寫作練習")
  ) {
    return "reading_writing_practice";
  }
  if (lowerTitle || lowerSnippet) return "page";
  return "search_result";
}

function getLevel(title, snippet, url) {
  const combo = `${title ?? ""} ${snippet ?? ""} ${url ?? ""}`.toLowerCase();
  if (
    combo.includes("pre a1") ||
    combo.includes("pre-a1") ||
    combo.includes("starters") ||
    combo.includes("劍橋兒童英檢") ||
    combo.includes("劍橋 starters") ||
    combo.includes("劍橋starters")
  ) {
    if (combo.includes("movers") || combo.includes("劍橋 movers")) return "A1 Movers";
    if (combo.includes("flyers") || combo.includes("劍橋 flyers")) return "A2 Flyers";
    return "Pre A1 Starters";
  }
  if (combo.includes("movers") || combo.includes("劍橋 movers")) return "A1 Movers";
  if (combo.includes("flyers") || combo.includes("劍橋 flyers")) return "A2 Flyers";
  return "unknown";
}

function getDetectedExamParts(title, snippet, url) {
  const combo = `${title ?? ""} ${snippet ?? ""} ${url ?? ""}`.toLowerCase();
  const parts = new Set();
  if (/listening part 1|\bl1\b|listen and draw lines/i.test(combo)) parts.add("L1");
  if (/listening part 2|\bl2\b|listen and write/i.test(combo)) parts.add("L2");
  if (/listening part 3|\bl3\b|listen and tick/i.test(combo)) parts.add("L3");
  if (/listening part 4|\bl4\b|listen and colour|listen and color/i.test(combo)) parts.add("L4");
  if (/reading writing part 1|\brw1\b|yes\s*\/\s*no|tick or cross/i.test(combo)) parts.add("RW1");
  if (/reading writing part 2|\brw2\b|read and write/i.test(combo)) parts.add("RW2");
  if (
    /reading writing part 3|\brw3\b|spelling|look at the picture.{0,20}write the word|拼字/i.test(combo)
  ) {
    parts.add("RW3");
  }
  if (/reading writing part 4|\brw4\b|fill in the gap|gap-fill|gap fill|填空/i.test(combo)) {
    parts.add("RW4");
  }
  if (/reading writing part 5|\brw5\b|read the story|配對/i.test(combo)) parts.add("RW5");
  if (parts.size === 0) return ["unknown"];
  return [...parts];
}

// ===========================================================================
// 5. Scoring
// ===========================================================================

const SHOPPING_KEYWORDS = [
  "amazon",
  "ebay",
  "buy now",
  "add to cart",
  "free shipping",
  "shop",
  "/cart",
  "/checkout",
  "購物",
  "購買",
];

const PRODUCT_URL_PATTERNS = [
  "/product/",
  "/products/",
  "/store/",
  "/buy/",
  "/cart",
  "shop.",
  "shop-",
];

const CORE_EN_KEYWORDS = ["starters", "pre a1", "pre-a1", "cambridge"];
const CORE_ZH_KEYWORDS = ["劍橋", "starters", "兒童英檢"];

function computeScoreAndReasons(result, level) {
  const title = (result.title ?? "").toLowerCase();
  const snippet = (result.snippet ?? "").toLowerCase();
  const url = (result.url ?? "").toLowerCase();
  const combo = `${title} ${snippet} ${url}`;
  const comboCaseSensitive = `${result.title ?? ""} ${result.snippet ?? ""} ${result.url ?? ""}`;

  let score = 0;
  const reasons = [];

  if (/\bstarters\b/i.test(combo)) {
    score += 3;
    reasons.push("keyword_starters");
  }
  if (/\bpre[\s-]a1\b/i.test(combo)) {
    score += 3;
    reasons.push("keyword_pre_a1");
  }
  if (/\bcambridge\b/i.test(combo)) {
    score += 2;
    reasons.push("keyword_cambridge");
  }
  if (/sample paper|sample test|mock test/i.test(combo)) {
    score += 2;
    reasons.push("keyword_sample_paper");
  }
  if (/\bpractice\b/i.test(combo)) {
    score += 1;
    reasons.push("keyword_practice");
  }
  if (/\bworksheet\b/i.test(combo)) {
    score += 1;
    reasons.push("keyword_worksheet");
  }
  if (/word\s*list|vocabulary\s*list|wordlist/i.test(combo)) {
    score += 2;
    reasons.push("keyword_word_list");
  }
  if (/listening practice|listening test/i.test(combo)) {
    score += 1;
    reasons.push("keyword_listening");
  }
  if (/reading writing|reading & writing/i.test(combo)) {
    score += 1;
    reasons.push("keyword_reading_writing");
  }

  if (comboCaseSensitive.includes("劍橋")) {
    score += 2;
    reasons.push("zh_keyword_cambridge");
  }
  if (/[一-鿿]/.test(comboCaseSensitive) && /starters/i.test(comboCaseSensitive)) {
    score += 3;
    reasons.push("zh_keyword_starters");
  }
  if (comboCaseSensitive.includes("兒童英檢")) {
    score += 2;
    reasons.push("zh_keyword_yle");
  }
  if (comboCaseSensitive.includes("練習題") || comboCaseSensitive.includes("練習")) {
    score += 1;
    reasons.push("zh_keyword_practice");
  }
  if (comboCaseSensitive.includes("歷屆") || comboCaseSensitive.includes("歷屆試題")) {
    score += 2;
    reasons.push("zh_keyword_past_paper");
  }
  if (comboCaseSensitive.includes("單字表") || comboCaseSensitive.includes("字彙表")) {
    score += 2;
    reasons.push("zh_keyword_word_list");
  }

  const isShopping =
    SHOPPING_KEYWORDS.some((k) => combo.includes(k)) ||
    PRODUCT_URL_PATTERNS.some((p) => url.includes(p));
  if (isShopping) {
    score -= 3;
    reasons.push("shopping_or_product_page");
  }

  const hasEnCore = CORE_EN_KEYWORDS.some((k) => combo.includes(k));
  const hasZhCore = CORE_ZH_KEYWORDS.some((k) =>
    k === "starters"
      ? /starters/i.test(comboCaseSensitive) && /[一-鿿]/.test(comboCaseSensitive)
      : comboCaseSensitive.includes(k),
  );
  if (level === "unknown" && !hasEnCore && !hasZhCore) {
    score -= 2;
    reasons.push("not_pre_a1_starters");
  }

  if (level === "A1 Movers" || level === "A2 Flyers") {
    score -= 1;
    reasons.push("non_target_level");
  }

  if ((result.snippet ?? "").trim().length < 20) {
    score -= 1;
    reasons.push("snippet_too_short");
  }

  return { score, reasons };
}

// ===========================================================================
// 6. collectorMode 建議
// ===========================================================================

function getCollectorMode(resourceType) {
  switch (resourceType) {
    case "page":
    case "worksheet":
    case "vocabulary_list":
    case "sample_paper":
    case "reading_writing_practice":
    case "listening_practice":
      return "full-text";
    case "pdf":
    case "image":
    case "audio":
    case "video":
    case "search_result":
    case "unknown":
    default:
      return "index-only";
  }
}

// ===========================================================================
// 7. 組裝單筆 discovered resource + shouldCollect rules + dedupe
// ===========================================================================

function buildDiscoveredResource(result, query, idx, nowIso) {
  const normalizedUrl = normalizeUrl(result.url);
  const duplicateKey = buildDuplicateKey(normalizedUrl);
  let sourceDomain = "";
  try {
    sourceDomain = new URL(result.url).hostname;
  } catch {
    sourceDomain = "";
  }
  const sourceType = getSourceType(sourceDomain);
  const resourceType = getResourceType(result.url, result.title, result.snippet);
  const level = getLevel(result.title, result.snippet, result.url);
  const detectedExamParts = getDetectedExamParts(result.title, result.snippet, result.url);
  const { score, reasons } = computeScoreAndReasons(result, level);
  const collectorMode = getCollectorMode(resourceType);

  return {
    id: `disc-gen-${String(idx + 1).padStart(4, "0")}`,
    sourceQueryId: query?.id ?? result.queryId ?? null,
    sourceQuery: query?.query ?? result.query ?? "",
    url: result.url,
    normalizedUrl: normalizedUrl ?? result.url,
    duplicateKey,
    title: result.title ?? "",
    snippet: result.snippet ?? "",
    sourceDomain,
    sourceType,
    resourceType,
    level,
    detectedExamParts,
    score,
    reasons,
    shouldCollect: true,
    collectorMode,
    reviewStatus: "discovered_candidate",
    discoveredAt: nowIso,
    provenance: {
      discoveryVersion: DISCOVERY_VERSION,
      searchProvider: result.sourceProvider ?? null,
      rank: typeof result.rank === "number" ? result.rank : null,
    },
  };
}

function applyShouldCollectRules(entry) {
  const blockReasons = new Set([
    "shopping_or_product_page",
    "not_pre_a1_starters",
    "duplicate_url",
  ]);
  for (const r of entry.reasons) {
    if (blockReasons.has(r)) {
      entry.shouldCollect = false;
      return;
    }
  }
  if (entry.score < 0) {
    entry.shouldCollect = false;
    if (!entry.reasons.includes("score_below_zero")) {
      entry.reasons.push("score_below_zero");
    }
    return;
  }
  entry.shouldCollect = true;
}

function applyDedupe(entries) {
  const byKey = new Map();
  for (const e of entries) {
    if (!e.duplicateKey) continue;
    const existing = byKey.get(e.duplicateKey);
    if (!existing) {
      byKey.set(e.duplicateKey, e);
    } else if (e.score > existing.score) {
      byKey.set(e.duplicateKey, e);
    }
  }
  for (const e of entries) {
    if (!e.duplicateKey) continue;
    const winner = byKey.get(e.duplicateKey);
    if (winner && winner !== e) {
      if (!e.reasons.includes("duplicate_url")) {
        e.reasons.push("duplicate_url");
      }
      e.score -= 2;
    }
  }
}

function classifyDiscoveredResources(batches, queriesById, nowIso) {
  const entries = [];
  let idx = 0;
  for (const batch of batches) {
    if (!batch || !Array.isArray(batch.results)) continue;
    const queryDef = queriesById.get(batch.queryId) ?? {
      id: batch.queryId ?? null,
      query: batch.query ?? "",
    };
    for (const r of batch.results) {
      if (!r || typeof r.url !== "string" || !r.url) continue;
      entries.push(buildDiscoveredResource(r, queryDef, idx, nowIso));
      idx += 1;
    }
  }
  applyDedupe(entries);
  for (const e of entries) applyShouldCollectRules(e);
  return entries;
}

// ===========================================================================
// 8. Provider adapters
// ===========================================================================

function sleep(ms) {
  return new Promise((res) => setTimeout(res, ms));
}

/**
 * manual-json：讀已整理的 search-results JSON；用既有 example 格式。
 * mock：與 manual-json 相同 input 格式，但 provider 標 mock。
 */
async function runManualJsonProvider(args) {
  const data = await loadManualSearchResults(args.input);
  // 補 provider / searchedAt（若 example JSON 沒有也補齊以便 search-results.generated.json 一致）
  const nowIso = new Date().toISOString();
  const batches = data.map((batch) => ({
    queryId: batch.queryId ?? null,
    query: batch.query ?? "",
    provider: "manual-json",
    searchedAt: batch.searchedAt ?? nowIso,
    results: Array.isArray(batch.results)
      ? batch.results.map((r) => ({
          title: r.title ?? "",
          url: r.url,
          snippet: r.snippet ?? "",
          sourceProvider: r.sourceProvider ?? "manual-json",
          rank: typeof r.rank === "number" ? r.rank : null,
        }))
      : [],
  }));
  return { batches, errors: [] };
}

async function runMockProvider(args) {
  const { batches } = await runManualJsonProvider(args);
  for (const b of batches) {
    b.provider = "mock";
    for (const r of b.results) r.sourceProvider = "mock";
  }
  return { batches, errors: [] };
}

/**
 * brave-search：對每條 query 呼叫 Brave Search API；每筆 result 標 sourceProvider: "brave-search"。
 * 單一 query fetch / 解析失敗時記錄 error、繼續下一條。
 */
async function runBraveSearchProvider(args, queries) {
  const apiKey = process.env.BRAVE_SEARCH_API_KEY;
  if (!apiKey || !apiKey.trim()) {
    console.error(
      "Error: BRAVE_SEARCH_API_KEY 未設定。\n" +
        "請依下列步驟操作：\n" +
        "  1. cp .env.example .env.local\n" +
        "  2. 編輯 .env.local 填入 BRAVE_SEARCH_API_KEY=...（key 自行向 Brave Search API 申請）\n" +
        "  3. 重新執行：BRAVE_SEARCH_API_KEY=... node scripts/discover_resources.mjs --provider brave-search ...\n" +
        "  注意：本腳本不會自動讀 .env.local；請用 shell export 或 inline 注入。\n",
    );
    process.exit(2);
  }

  const limitPerQuery = args.limitPerQuery ?? DEFAULT_LIMIT_PER_QUERY;
  const queryLimit = args.queryLimit ?? DEFAULT_QUERY_LIMIT;
  const effectiveQueries = queries.slice(0, queryLimit);
  const batches = [];
  const errors = [];

  console.error(
    `[discovery] brave-search: 共 ${queries.length} 條 query，本輪將跑前 ${effectiveQueries.length} 條（--query-limit=${queryLimit}），每條最多 ${limitPerQuery} 筆 result`,
  );

  for (let i = 0; i < effectiveQueries.length; i++) {
    const q = effectiveQueries[i];
    if (!q || typeof q.query !== "string" || !q.query.trim()) {
      errors.push({ queryId: q?.id ?? null, error: "query 欄位空或缺" });
      continue;
    }
    if (i > 0) await sleep(INTER_QUERY_DELAY_MS);
    const nowIso = new Date().toISOString();
    try {
      const results = await fetchBraveSearch(q.query, limitPerQuery, apiKey);
      console.error(
        `[discovery] brave-search [${i + 1}/${effectiveQueries.length}] queryId=${q.id} query="${q.query}" → ${results.length} results`,
      );
      batches.push({
        queryId: q.id ?? null,
        query: q.query,
        provider: "brave-search",
        searchedAt: nowIso,
        results,
      });
    } catch (err) {
      const msg = err?.message ?? String(err);
      console.error(
        `[discovery] brave-search [${i + 1}/${effectiveQueries.length}] queryId=${q.id} query="${q.query}" → error: ${msg}（不中斷整批，繼續下一條）`,
      );
      errors.push({ queryId: q.id ?? null, query: q.query, error: msg });
    }
  }

  return { batches, errors };
}

async function fetchBraveSearch(query, count, apiKey) {
  const url = new URL(BRAVE_ENDPOINT);
  url.searchParams.set("q", query);
  url.searchParams.set("count", String(Math.min(count, BRAVE_MAX_COUNT)));
  url.searchParams.set("safesearch", "moderate");

  const ac = new AbortController();
  const timer = setTimeout(() => ac.abort(), FETCH_TIMEOUT_MS);
  let res;
  try {
    res = await fetch(url, {
      method: "GET",
      headers: {
        Accept: "application/json",
        "Accept-Encoding": "gzip",
        "X-Subscription-Token": apiKey,
        "User-Agent": BRAVE_USER_AGENT,
      },
      signal: ac.signal,
    });
  } finally {
    clearTimeout(timer);
  }

  if (!res.ok) {
    let body = "";
    try {
      body = (await res.text()).slice(0, 200);
    } catch {
      /* ignore */
    }
    throw new Error(`Brave Search HTTP ${res.status} ${res.statusText}: ${body}`);
  }

  let json;
  try {
    json = await res.json();
  } catch (err) {
    throw new Error(`Brave Search response JSON parse failed: ${err.message}`);
  }

  const webResults = json?.web?.results;
  if (!Array.isArray(webResults)) return [];

  return webResults.slice(0, count).map((r, idx) => ({
    title: r.title ?? "",
    url: r.url ?? "",
    snippet: r.description ?? "",
    sourceProvider: "brave-search",
    rank: idx + 1,
  }));
}

async function runSearchProvider(args, queries) {
  switch (args.provider) {
    case "manual-json":
      return runManualJsonProvider(args);
    case "mock":
      return runMockProvider(args);
    case "brave-search":
      return runBraveSearchProvider(args, queries);
    default:
      throw new Error(`Internal error: unsupported provider "${args.provider}"`);
  }
}

// ===========================================================================
// 9. Main
// ===========================================================================

async function main() {
  let args;
  try {
    args = parseArgs(process.argv.slice(2));
  } catch (err) {
    console.error(`Error: ${err.message}`);
    console.error(HELP_TEXT);
    process.exit(2);
  }
  if (args.help) {
    console.log(HELP_TEXT);
    process.exit(0);
  }
  if (process.argv.length <= 2) {
    console.log(HELP_TEXT);
    process.exit(2);
  }
  try {
    validateArgs(args);
  } catch (err) {
    console.error(`Error: ${err.message}`);
    process.exit(2);
  }

  console.error(
    `[discovery] provider=${args.provider} input=${args.input ?? "-"} ` +
      `queries=${args.queries ?? args.queryFile ?? "-"} ` +
      `limit-per-query=${args.limitPerQuery ?? DEFAULT_LIMIT_PER_QUERY} ` +
      `query-limit=${args.queryLimit ?? DEFAULT_QUERY_LIMIT}`,
  );

  // 1. 讀 queries（real provider 必需；manual-json / mock 也用來補 sourceQueryId 對齊）
  let queries = [];
  const queriesPath = args.queries ?? args.queryFile;
  if (queriesPath) {
    try {
      queries = await loadQueries(queriesPath);
    } catch (err) {
      console.error(`Error: ${err.message}`);
      process.exit(2);
    }
  }
  const queriesById = new Map();
  for (const q of queries) {
    if (q && typeof q.id === "string") queriesById.set(q.id, q);
  }

  // 2. 跑 provider → 拿 search batches
  let providerOut;
  try {
    providerOut = await runSearchProvider(args, queries);
  } catch (err) {
    console.error(`Error running provider "${args.provider}": ${err.message}`);
    process.exit(2);
  }
  const { batches, errors } = providerOut;

  // 3. 真實 provider 模式：寫 search-results.generated.json（若有指定 --search-out 或預設行為）
  if (REAL_SEARCH_PROVIDERS.has(args.provider) && args.searchOut) {
    const searchOutPath = resolve(args.searchOut);
    await writeJson(searchOutPath, batches);
    console.error(
      `[discovery] wrote ${batches.length} search batches to ${searchOutPath}`,
    );
  } else if (REAL_SEARCH_PROVIDERS.has(args.provider) && !args.searchOut) {
    console.error(
      "[discovery] (--search-out 未提供，跳過 search-results.generated.json 寫檔)",
    );
  }

  // 4. classify / dedupe / score / shouldCollect
  const nowIso = new Date().toISOString();
  const entries = classifyDiscoveredResources(batches, queriesById, nowIso);

  // 5. 寫 discovered-resources.generated.json
  const outPath = args.out ? resolve(args.out) : DEFAULT_DISCOVERED_OUT;
  await writeJson(outPath, entries);

  const shouldCollectCount = entries.filter((e) => e.shouldCollect).length;
  const totalResults = batches.reduce(
    (acc, b) => acc + (Array.isArray(b.results) ? b.results.length : 0),
    0,
  );
  console.error(
    `[discovery] provider=${args.provider} read ${totalResults} search results from ${batches.length} batches; ` +
      `wrote ${entries.length} entries (${shouldCollectCount} shouldCollect=true) to ${outPath}`,
  );
  if (errors.length) {
    console.error(`[discovery] ${errors.length} query errors:`);
    for (const e of errors) {
      console.error(`  - queryId=${e.queryId} error="${e.error}"`);
    }
  }
}

main().catch((err) => {
  console.error(`[discovery] unexpected error: ${err.stack ?? err.message}`);
  process.exit(1);
});
