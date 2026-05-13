#!/usr/bin/env node
/**
 * scripts/collect_discovered_resources.mjs
 *
 * P3-10-D-3：Discovery → Collector 自動 pipe（v0.1）。
 *
 * 對應 docs/DISCOVERY_CRAWLER_PLAN.md / docs/WEB_RESOURCE_COLLECTOR_PLAN.md。
 *
 * 用途：
 *   - 讀 `data/imported/discovered-resources.generated.json` 內 `shouldCollect=true` 的條目
 *   - 對每筆依 `collectorMode` / `resourceType` 決定處理策略：
 *       * HTML + full-text  → 重用 web_resource_collect.mjs 的 buildSourceDocumentEntry
 *       * HTML + index-only → 重用 buildResourceIndexEntry
 *       * pdf / image / audio / video → HEAD only，記 metadata + warnings，**不下載 / 不解析**
 *   - 寫出 `data/imported/source-documents.batch.generated.json`（batch 結構）
 *
 * 硬邊界（對齊 D-3 任務單）：
 *   - ❌ 不解析 PDF（pdf_parser_not_implemented warning）
 *   - ❌ 不下載 asset 到 public/（asset_collection_not_implemented warning）
 *   - ❌ 不寫正式題庫（不動 data/p3-example-questions.json / data/exam-papers.example.json）
 *   - ❌ 不呼叫 OpenAI / 任何 AI normalizer
 *   - ❌ 不偽裝 user-agent（沿用 collector 預設 UA cambridge-starters-practice-collector/0.1）
 *   - ❌ 不大改 web_resource_collect.mjs（只加 export + 把 main() 包進 entry-script 判斷）
 *
 * 使用方式：
 *   help：
 *     node scripts/collect_discovered_resources.mjs --help
 *
 *   dry-run（不 fetch URL，只列出會處理哪些 resource）：
 *     node scripts/collect_discovered_resources.mjs \
 *       --input data/imported/discovered-resources.generated.json \
 *       --out data/imported/source-documents.batch.generated.json \
 *       --limit 5 --dry-run yes
 *
 *   real collect 小量（建議第一次只跑 limit=1）：
 *     node scripts/collect_discovered_resources.mjs \
 *       --input data/imported/discovered-resources.generated.json \
 *       --out data/imported/source-documents.batch.generated.json \
 *       --limit 1
 *
 * exit code：
 *   0  成功
 *   1  未預期錯誤（整批 abort）
 *   2  CLI 參數錯 / input 檔不存在 / JSON parse 失敗
 */

import { readFile, writeFile, mkdir } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import {
  COLLECTOR_VERSION,
  COLLECTOR_USER_AGENT,
  DEFAULT_TIMEOUT_MS,
  fetchUrl,
  buildResourceIndexEntry,
  buildSourceDocumentEntry,
} from "./web_resource_collect.mjs";

// ===========================================================================
// 0. 常數
// ===========================================================================

const PIPE_VERSION = "collect_discovered_resources.mjs@v0.1";
const DEFAULT_LIMIT = 5;
const INTER_FETCH_DELAY_MS = 500;
const ASSET_RESOURCE_TYPES = new Set(["pdf", "image", "audio", "video"]);

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(__dirname, "..");
const DEFAULT_INPUT = resolve(
  REPO_ROOT,
  "data",
  "imported",
  "discovered-resources.generated.json",
);
const DEFAULT_OUT = resolve(
  REPO_ROOT,
  "data",
  "imported",
  "source-documents.batch.generated.json",
);

const HELP_TEXT = `\ncollect_discovered_resources.mjs — P3-10-D-3 Discovery → Collector pipe v0.1\n
Usage:
  node scripts/collect_discovered_resources.mjs \\
    --input <discovered-resources.generated.json> \\
    --out <source-documents.batch.generated.json> \\
    [--limit ${DEFAULT_LIMIT}] \\
    [--only-should-collect yes|no] \\
    [--dry-run yes|no]

Options:
  --input <path>                 選填；discovery output JSON（預設 data/imported/discovered-resources.generated.json）
  --out <path>                   選填；batch output JSON（預設 data/imported/source-documents.batch.generated.json）
  --limit <n>                    選填；最多處理 N 筆 eligible（預設 ${DEFAULT_LIMIT}）；防呆避免一次抓太多
  --only-should-collect <yes|no> 選填；預設 yes；no 時連 shouldCollect=false 也會跑（仍記 reason）
  --dry-run <yes|no>             選填；預設 no；yes 時不 fetch URL，只列出會處理哪些 resource，每筆 status="dry_run"
  --help                         印此使用說明

Pipe 行為：
  - shouldCollect=true（且 --only-should-collect=yes）的條目進入 eligible 清單
  - 依 limit 取前 N 筆 eligible，其餘標 skipped + skip_due_to_limit
  - resourceType ∈ { pdf, image, audio, video }：HEAD 抓 metadata（contentType / contentLength / httpStatus），warnings 含 asset_collection_not_implemented（pdf 多一筆 pdf_parser_not_implemented），**不下載 binary / 不解析**
  - 其他 resourceType + collectorMode=full-text：重用 collector buildSourceDocumentEntry（含 cleanedText / headings / links / assets / extractedCandidates）
  - 其他 resourceType + collectorMode=index-only：重用 collector buildResourceIndexEntry
  - 單筆 fetch / parse 失敗：記 error 並繼續下一筆，整批不中斷

Output：
  - data/imported/source-documents.batch.generated.json（覆寫式；已 .gitignore）
  - 不會寫入 data/p3-example-questions.json / data/exam-papers.example.json

Hardcoded constraints：
  - 每 fetch 之間 ${INTER_FETCH_DELAY_MS}ms delay（rate-limit safety）
  - HTTP timeout ${DEFAULT_TIMEOUT_MS}ms（沿用 collector 預設）
  - 不寫正式題庫；不呼叫 OpenAI；不下載 PDF / image / audio；不解析 PDF

Examples:
  # dry-run
  node scripts/collect_discovered_resources.mjs \\
    --input data/imported/discovered-resources.generated.json \\
    --out data/imported/source-documents.batch.generated.json \\
    --limit 5 --dry-run yes

  # real, limit 1
  node scripts/collect_discovered_resources.mjs --limit 1
`;

// ===========================================================================
// 1. CLI arg parsing
// ===========================================================================

function parseYesNo(value, flag) {
  if (value === "yes" || value === "no") return value === "yes";
  throw new Error(`${flag} 必須是 yes 或 no（got: ${value}）`);
}

function parseArgs(argv) {
  const out = {
    input: null,
    out: null,
    limit: null,
    onlyShouldCollect: true,
    dryRun: false,
    help: false,
  };
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === "--help" || arg === "-h") {
      out.help = true;
    } else if (arg === "--input") {
      out.input = argv[++i];
    } else if (arg === "--out") {
      out.out = argv[++i];
    } else if (arg === "--limit") {
      const n = Number(argv[++i]);
      if (!Number.isInteger(n) || n <= 0) {
        throw new Error(`--limit 必須是正整數（got: ${argv[i]}）`);
      }
      out.limit = n;
    } else if (arg === "--only-should-collect") {
      out.onlyShouldCollect = parseYesNo(argv[++i], "--only-should-collect");
    } else if (arg === "--dry-run") {
      out.dryRun = parseYesNo(argv[++i], "--dry-run");
    } else {
      throw new Error(`Unknown argument: ${arg}`);
    }
  }
  return out;
}

// ===========================================================================
// 2. helpers
// ===========================================================================

function sleep(ms) {
  return new Promise((res) => setTimeout(res, ms));
}

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

function makeBatchId() {
  const ts = new Date().toISOString().replace(/[:.]/g, "-");
  return `batch-${ts}`;
}

// ===========================================================================
// 3. HEAD-only fetch（給 pdf / image / audio / video 用，不下載 body）
// ===========================================================================

async function fetchHead(url, timeoutMs) {
  const ac = new AbortController();
  const timer = setTimeout(() => ac.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      method: "HEAD",
      headers: {
        "user-agent": COLLECTOR_USER_AGENT,
        accept: "*/*",
      },
      redirect: "follow",
      signal: ac.signal,
    });
    const contentLengthRaw = res.headers.get("content-length");
    const contentLength = contentLengthRaw ? Number(contentLengthRaw) : null;
    return {
      status: res.status,
      contentType: res.headers.get("content-type") ?? "",
      contentLength: Number.isFinite(contentLength) ? contentLength : null,
      method: "HEAD",
    };
  } finally {
    clearTimeout(timer);
  }
}

// ===========================================================================
// 4. 單筆 entry 處理
// ===========================================================================

function makeBaseItem(entry) {
  return {
    discoveredResourceId: entry.id ?? null,
    url: entry.url ?? null,
    sourceQueryId: entry.sourceQueryId ?? null,
    sourceQuery: entry.sourceQuery ?? null,
    sourceType: entry.sourceType ?? "unknown",
    resourceType: entry.resourceType ?? "unknown",
    level: entry.level ?? "unknown",
    detectedExamParts: Array.isArray(entry.detectedExamParts)
      ? [...entry.detectedExamParts]
      : [],
    score: typeof entry.score === "number" ? entry.score : null,
    reasons: Array.isArray(entry.reasons) ? [...entry.reasons] : [],
    reviewStatus: entry.reviewStatus ?? "discovered_candidate",
    collectorMode: entry.collectorMode ?? "index-only",
    discoveryProvenance: entry.provenance ?? null,
    status: null,
    warnings: [],
    error: null,
    collectedAt: null,
    document: null,
  };
}

function buildCollectorArgs(entry) {
  return {
    url: entry.url,
    sourceType: entry.sourceType ?? "unknown",
    sourceName: entry.title || entry.sourceDomain || null,
  };
}

async function processAssetEntry(entry, baseItem) {
  baseItem.warnings.push({
    code: "asset_collection_not_implemented",
    message:
      "本輪 D-3 不下載 / 不解析 asset（pdf / image / audio / video）；僅以 HEAD 抓 metadata（contentType / contentLength / httpStatus）。asset-aware 下載屬未來範圍（P3-10 後續刀數）。",
  });
  if (entry.resourceType === "pdf") {
    baseItem.warnings.push({
      code: "pdf_parser_not_implemented",
      message:
        "PDF parser 屬 P3-10 後續刀數（需評估 pdfjs-dist / pdf-parse 依賴）。本筆 entry 僅記 metadata，後續仍需人工檢視 + AI normalizer + human review 才能進正式題庫。",
    });
  }
  try {
    const head = await fetchHead(entry.url, DEFAULT_TIMEOUT_MS);
    if (head.status < 200 || head.status >= 300) {
      baseItem.warnings.push({
        code: "non_2xx_status",
        message: `HEAD HTTP ${head.status}；asset metadata 仍記，但需人工檢查實際內容是否可用`,
      });
    }
    baseItem.status = "collected";
    baseItem.collectedAt = new Date().toISOString();
    baseItem.document = {
      kind: "asset_metadata",
      url: entry.url,
      httpStatus: head.status,
      contentType: head.contentType,
      contentLength: head.contentLength,
      method: head.method,
      retrievedAt: baseItem.collectedAt,
      pipeVersion: PIPE_VERSION,
      collectorVersion: COLLECTOR_VERSION,
      note: "asset metadata only — body 未下載、未解析",
    };
  } catch (err) {
    baseItem.status = "failed";
    baseItem.error = err?.message ?? String(err);
    baseItem.collectedAt = new Date().toISOString();
  }
  return baseItem;
}

async function processHtmlEntry(entry, baseItem) {
  const args = buildCollectorArgs(entry);
  let fetched;
  try {
    fetched = await fetchUrl(args.url, DEFAULT_TIMEOUT_MS);
  } catch (err) {
    baseItem.status = "failed";
    baseItem.error = err?.message ?? String(err);
    baseItem.collectedAt = new Date().toISOString();
    return baseItem;
  }
  let document;
  if (entry.collectorMode === "full-text") {
    document = buildSourceDocumentEntry(args, fetched);
    document.kind = "source_document";
  } else {
    document = buildResourceIndexEntry(args, fetched);
    document.kind = "resource_index";
  }
  // collector 已產 warnings；pipe 直接搬上來
  baseItem.warnings = Array.isArray(document.warnings) ? [...document.warnings] : [];
  baseItem.status = "collected";
  baseItem.collectedAt = new Date().toISOString();
  baseItem.document = document;
  return baseItem;
}

async function processOne(entry, opts) {
  const baseItem = makeBaseItem(entry);

  if (opts.dryRun) {
    baseItem.status = "dry_run";
    baseItem.collectedAt = new Date().toISOString();
    baseItem.warnings.push({
      code: "dry_run",
      message: `dry-run：未實際 fetch。計畫策略：${
        ASSET_RESOURCE_TYPES.has(entry.resourceType)
          ? `HEAD only（resourceType=${entry.resourceType}）+ warnings: asset_collection_not_implemented${entry.resourceType === "pdf" ? " + pdf_parser_not_implemented" : ""}`
          : `collectorMode=${entry.collectorMode}（重用 ${entry.collectorMode === "full-text" ? "buildSourceDocumentEntry" : "buildResourceIndexEntry"}）`
      }`,
    });
    return baseItem;
  }

  if (ASSET_RESOURCE_TYPES.has(entry.resourceType)) {
    return processAssetEntry(entry, baseItem);
  }
  return processHtmlEntry(entry, baseItem);
}

// ===========================================================================
// 5. main
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

  const inputPath = args.input ? resolve(args.input) : DEFAULT_INPUT;
  const outPath = args.out ? resolve(args.out) : DEFAULT_OUT;
  const limit = args.limit ?? DEFAULT_LIMIT;

  console.error(
    `[pipe] input=${inputPath} out=${outPath} limit=${limit} only-should-collect=${args.onlyShouldCollect ? "yes" : "no"} dry-run=${args.dryRun ? "yes" : "no"}`,
  );

  let inputData;
  try {
    inputData = await readJsonFile(inputPath);
  } catch (err) {
    console.error(`Error: ${err.message}`);
    console.error(
      "提示：請確認 discovery output 存在。" +
        "若還沒跑過 discovery，請先執行 scripts/discover_resources.mjs（manual-json / mock / brave-search 任一 provider）。",
    );
    process.exit(2);
  }
  if (!Array.isArray(inputData)) {
    console.error(`Error: input JSON 必須是 array：${inputPath}`);
    process.exit(2);
  }

  // 分流：eligible（shouldCollect=true 或 --only-should-collect=no）vs skipped
  const items = [];
  const eligible = [];
  for (const e of inputData) {
    if (!e || typeof e.url !== "string" || !e.url) {
      const baseItem = makeBaseItem(e ?? {});
      baseItem.status = "skipped";
      baseItem.warnings.push({
        code: "skipped_missing_url",
        message: "discovery entry 缺 url，無法處理",
      });
      items.push(baseItem);
      continue;
    }
    if (args.onlyShouldCollect && e.shouldCollect !== true) {
      const baseItem = makeBaseItem(e);
      baseItem.status = "skipped";
      baseItem.warnings.push({
        code: "skipped_not_should_collect",
        message: `shouldCollect=${e.shouldCollect}；--only-should-collect=yes 跳過。reasons: ${(e.reasons ?? []).join(",") || "(none)"}`,
      });
      items.push(baseItem);
      continue;
    }
    eligible.push(e);
  }

  const eligibleCount = eligible.length;
  const toProcess = eligible.slice(0, limit);
  for (let i = limit; i < eligible.length; i++) {
    const baseItem = makeBaseItem(eligible[i]);
    baseItem.status = "skipped";
    baseItem.warnings.push({
      code: "skip_due_to_limit",
      message: `--limit=${limit} 限制：本 batch 只處理前 ${limit} 筆 eligible（本筆為第 ${i + 1} 筆）`,
    });
    items.push(baseItem);
  }

  // 跑 eligible
  for (let i = 0; i < toProcess.length; i++) {
    if (i > 0 && !args.dryRun) await sleep(INTER_FETCH_DELAY_MS);
    const e = toProcess[i];
    console.error(
      `[pipe] [${i + 1}/${toProcess.length}] ${args.dryRun ? "[dry-run] " : ""}` +
        `discoveredResourceId=${e.id} resourceType=${e.resourceType} collectorMode=${e.collectorMode} url=${e.url}`,
    );
    const item = await processOne(e, { dryRun: args.dryRun });
    items.push(item);
  }

  // summary
  const totalInput = inputData.length;
  const collected = items.filter((it) => it.status === "collected").length;
  const dryRunCount = items.filter((it) => it.status === "dry_run").length;
  const skipped = items.filter((it) => it.status === "skipped").length;
  const failed = items.filter((it) => it.status === "failed").length;
  const payload = {
    batchId: makeBatchId(),
    createdAt: new Date().toISOString(),
    source: PIPE_VERSION,
    input: inputPath,
    dryRun: args.dryRun,
    summary: {
      totalInput,
      eligible: eligibleCount,
      collected,
      dryRun: dryRunCount,
      skipped,
      failed,
    },
    items,
  };

  await writeJson(outPath, payload);
  console.error(
    `[pipe] wrote batch to ${outPath} — totalInput=${totalInput} eligible=${eligibleCount} ` +
      `collected=${collected} dryRun=${dryRunCount} skipped=${skipped} failed=${failed}`,
  );
}

const isCliInvocation =
  import.meta.url === pathToFileURL(process.argv[1] ?? "").href;
if (isCliInvocation) {
  main().catch((err) => {
    console.error(`[pipe] unexpected error: ${err.stack ?? err.message}`);
    process.exit(1);
  });
}
