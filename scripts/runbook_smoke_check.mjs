#!/usr/bin/env node
/**
 * scripts/runbook_smoke_check.mjs
 *
 * P3-10-Q / P3-10-R：Source-first pipeline runbook offline smoke check（v0.2）。
 *
 * 對應 docs/SOURCE_FIRST_PIPELINE_RUNBOOK.md 第 10 段。
 *
 * 用途：
 *   - 一鍵驗證 9 個 CLI script 與 runbook 命令仍對齊（`--help` exit 0）。
 *   - 用 example data + /tmp 工作目錄跑端到端 build / validate / merge / collect-gate /
 *     normalize-gate / review prepare / validate-reviewed / approve preview /
 *     assemble paper preview 流程，確認管線本身沒有 regression。
 *   - **完全離線**：不呼叫 Brave / OpenAI、不發 HTTP、不下載 PDF / image / audio。
 *   - **絕不**修改正式題庫（`data/p3-example-questions.json` / `data/exam-papers.example.json`）。
 *   - approve / assemble 一律只跑 **preview mode**，**絕不**`--mode write` / `--write yes`。
 *
 * 不在範圍：
 *   - 不代表來源 / 題目已通過審核
 *   - 不代表 `/quiz` 已使用 imported 題庫
 *   - 不寫任何 repo 內檔案（fixture 都在 OS temp dir）
 *   - 不取代 reviewer 對 runbook 第 3 / 5 / 8 / 9 段的人工審核責任
 *   - 不取代 Codex 對 preview JSON 的人工驗收
 *
 * 使用方式：
 *   npm run runbook:check
 *   node scripts/runbook_smoke_check.mjs
 *
 * Exit code：
 *   0  所有檢查通過（含 9 個 `--help` + 端到端 fixture + safety check）
 *   1  任一檢查失敗（印出失敗詳情）
 */

import { spawnSync } from "node:child_process";
import { mkdtemp, mkdir, readFile, writeFile, rm } from "node:fs/promises";
import { createHash } from "node:crypto";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(__dirname, "..");

const SMOKE_VERSION = "runbook_smoke_check.mjs@v0.2";

// ===========================================================================
// CLI list（對齊 docs/SOURCE_FIRST_PIPELINE_RUNBOOK.md 第 9 段）
// ===========================================================================

const CLI_SCRIPTS = [
  "scripts/discover_resources.mjs",
  "scripts/build_source_registry.mjs",
  "scripts/validate_source_registry.mjs",
  "scripts/collect_discovered_resources.mjs",
  "scripts/web_resource_collect.mjs",
  "scripts/normalize_collected_sources.mjs",
  "scripts/review_normalized_questions.mjs",
  "scripts/approve_reviewed_questions.mjs",
  "scripts/assemble_practice_paper.mjs",
];

// 安全檢查：smoke 跑完後驗證下列正式檔仍未被改動
const FORMAL_FILES = [
  "data/p3-example-questions.json",
  "data/exam-papers.example.json",
];

// 安全檢查：smoke **絕不**該寫到下列 generated path（屬正式 pipeline 共用，非 smoke 範圍）
const FORBIDDEN_GENERATED_PATHS = [
  "data/imported/source-registry.generated.json",
  "data/imported/reviewed-questions.generated.json",
  "data/imported/review-validation.generated.json",
  "data/imported/normalized-questions.generated.json",
  "data/imported/source-documents.batch.generated.json",
  "data/imported/approved-questions.preview.generated.json",
  "data/imported/practice-paper.preview.generated.json",
  "data/imported/discovered-resources.generated.json",
  "data/imported/resource-index.generated.json",
  "data/imported/source-document.generated.json",
  "data/imported/search-results.generated.json",
];

// ===========================================================================
// helpers
// ===========================================================================

function runCli(scriptPath, args) {
  const res = spawnSync(process.execPath, [scriptPath, ...args], {
    encoding: "utf8",
    cwd: REPO_ROOT,
    env: process.env,
  });
  return {
    code: res.status,
    signal: res.signal,
    stdout: res.stdout ?? "",
    stderr: res.stderr ?? "",
    error: res.error ? String(res.error) : null,
  };
}

async function readJsonFile(path) {
  const raw = await readFile(path, "utf8");
  return JSON.parse(raw);
}

async function writeJsonFile(path, payload) {
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, JSON.stringify(payload, null, 2) + "\n", "utf8");
}

async function hashFile(path) {
  try {
    const buf = await readFile(path);
    return createHash("sha256").update(buf).digest("hex");
  } catch {
    return null;
  }
}

async function fileExistsAtAll(path) {
  try {
    await readFile(path);
    return true;
  } catch {
    return false;
  }
}

// ===========================================================================
// fixture builders（離線、可預期、不放任何 API key / 真實授權聲稱）
// ===========================================================================

/**
 * Build a minimal registry entry that passes scripts/validate_source_registry.mjs.
 *
 * Defaults to a `third_party_practice` entry with `publisherType="third_party"` —
 * this combination is valid even when reviewStatus="approved_for_import" because
 * validator rule #6 only restricts publisherType for official_sample / past_paper.
 */
function makeRegistryEntry({ sourceId, sourceUrl, reviewStatus, title }) {
  return {
    sourceId,
    title: title ?? `Smoke fixture ${sourceId}`,
    sourceKind: "third_party_practice",
    sourceUrl,
    publisher: "smoke-fixture.test",
    publisherType: "third_party",
    language: "en",
    level: "Pre A1 Starters",
    exam: "Cambridge Starters",
    partsCovered: ["unknown"],
    fileType: "html",
    accessType: "unknown",
    collectionStatus: "discovered",
    reviewStatus,
    provenanceNotes:
      "Smoke fixture (offline; never used as a real source). Reviewer must verify before any actual import.",
    rightsNotes:
      "Smoke fixture; not reviewed for actual import use. This is a test fixture only, not a license claim.",
    collectedAt: null,
    lastCheckedAt: null,
  };
}

function makeDiscoveryEntry({ id, url }) {
  let hostname = "example.invalid";
  try {
    hostname = new URL(url).hostname;
  } catch {
    /* keep fallback */
  }
  return {
    id,
    sourceQueryId: "smoke-q-1",
    sourceQuery: "smoke fixture",
    url,
    normalizedUrl: url,
    duplicateKey: url,
    title: `Smoke discovery ${id}`,
    snippet: "Smoke fixture entry — offline only.",
    sourceDomain: hostname,
    sourceType: "third_party",
    resourceType: "page",
    level: "Pre A1 Starters",
    detectedExamParts: ["unknown"],
    score: 6,
    reasons: [],
    shouldCollect: true,
    collectorMode: "full-text",
    reviewStatus: "discovered_candidate",
    discoveredAt: "2026-05-16T00:00:00.000Z",
  };
}

function makeBatchSourceDocItem({ id, url }) {
  return {
    discoveredResourceId: id,
    url,
    sourceQueryId: "smoke-q-1",
    sourceQuery: "smoke fixture",
    sourceType: "third_party",
    resourceType: "page",
    level: "Pre A1 Starters",
    detectedExamParts: ["unknown"],
    score: 6,
    reasons: [],
    reviewStatus: "discovered_candidate",
    collectorMode: "full-text",
    status: "collected",
    warnings: [],
    error: null,
    collectedAt: "2026-05-16T00:00:00.000Z",
    document: {
      kind: "source_document",
      url,
      title: `Smoke doc ${id}`,
      headings: [{ level: 1, text: "Smoke heading" }],
      cleanedText:
        "Look at the picture. Write the word. Smoke fixture cleaned text for offline normalize check.",
      links: [],
      assets: [],
      extractedCandidates: [
        {
          candidateType: "question",
          text: "Look at the picture. Write the word.",
          likelyQuestionType: "spelling",
          likelyStarterPart: "RW3",
          confidence: 0.7,
          notes: "smoke fixture",
        },
      ],
    },
  };
}

/**
 * Take prepare-review output (containing reviewerFields template) and "fake-approve"
 * the first queued item — only for smoke purposes. The fake-approved fixture is
 * **never** copied into any reviewer flow outside this script.
 */
function fakeApproveFirstReviewItem(reviewedBatch) {
  if (!reviewedBatch || !Array.isArray(reviewedBatch.items)) {
    throw new Error("prepare-review output 缺 items[]，無法 fake-approve");
  }
  const idx = reviewedBatch.items.findIndex((it) => it?.status === "queued");
  if (idx === -1) {
    throw new Error("prepare-review output 沒有任何 status=queued 的 item");
  }
  const it = reviewedBatch.items[idx];
  it.reviewStatus = "approved_for_practice";
  it.status = "queued"; // 保持 queued；approve_reviewed 不看 status，看 reviewStatus + reviewerFields
  if (!it.reviewerFields) it.reviewerFields = {};
  it.reviewerFields.approved = true;
  it.reviewerFields.approvedForPractice = true;
  it.reviewerFields.reviewerNotes =
    "[smoke fixture] auto-approved by runbook smoke check — never use this in real flow.";
  it.reviewerFields.finalQuestion = {
    id: "smoke-rw3-001",
    type: "spelling",
    starterPart: "RW3",
    prompt: "Look at the picture. Write the word.",
    answer: "apple",
    options: [],
    explanation: "Smoke fixture only.",
    imageSrc: "",
    audioSrc: "",
  };
  return reviewedBatch;
}

/**
 * Build a minimal ExamQuestion array for assemble preview smoke.
 * Uses source="custom" + starterSection="reading-writing" + starterPart="RW3"
 * to produce a paper with at least 1 section.
 */
function makeSmokeExamQuestion() {
  return {
    id: "smoke-rw3-001",
    type: "spelling",
    source: "custom",
    prompt: "Look at the picture. Write the word.",
    answer: "apple",
    explanation: "Smoke fixture only.",
    starterSection: "reading-writing",
    starterPart: "RW3",
  };
}

// ===========================================================================
// main
// ===========================================================================

async function main() {
  process.stdout.write(
    `${SMOKE_VERSION} — Source-first pipeline offline smoke check\n`,
  );

  let work = null;
  let finalOk = false;
  let unexpectedErr = null;

  try {
    work = await mkdtemp(
      join(tmpdir(), "cambridge-starters-runbook-smoke-"),
    );
    process.stdout.write(`working dir: ${work}\n\n`);

    // 安全 baseline：snapshot 正式檔 hash + forbidden generated paths
    const formalBefore = {};
    for (const f of FORMAL_FILES) {
      formalBefore[f] = await hashFile(join(REPO_ROOT, f));
    }
    const forbiddenBefore = {};
    for (const f of FORBIDDEN_GENERATED_PATHS) {
      forbiddenBefore[f] = await fileExistsAtAll(join(REPO_ROOT, f));
    }

    const checks = [];
    let halted = false;

    function record(name, passed, details, failure) {
      checks.push({ name, passed, details, failure });
      if (!passed) halted = true;
    }

    // ---------------------------------------------------------------------
    // [1] 9 CLI --help checks
    // ---------------------------------------------------------------------
    {
      const failed = [];
      for (const s of CLI_SCRIPTS) {
        const r = runCli(s, ["--help"]);
        if (r.code !== 0) {
          failed.push({
            script: s,
            code: r.code,
            stderr: r.stderr.slice(0, 200),
          });
        }
      }
      record(
        "9 CLI --help checks",
        failed.length === 0,
        failed.length === 0
          ? `passed: ${CLI_SCRIPTS.length}/${CLI_SCRIPTS.length}`
          : `failed: ${failed.length}/${CLI_SCRIPTS.length}`,
        failed.length === 0 ? null : failed,
      );
    }

    // ---------------------------------------------------------------------
    // [2] build registry from example discovery
    // ---------------------------------------------------------------------
    const exampleDiscovery = join(
      REPO_ROOT,
      "data",
      "imported",
      "discovered-resources.example.json",
    );
    const registryOut = join(work, "source-registry.json");
    if (!halted) {
      const r = runCli("scripts/build_source_registry.mjs", [
        "--input", exampleDiscovery,
        "--out", registryOut,
        "--mode", "build",
        "--limit", "20",
      ]);
      record(
        "build registry (example discovery)",
        r.code === 0,
        r.code === 0 ? `wrote ${registryOut}` : `exit=${r.code}`,
        r.code === 0 ? null : {
          stdout: r.stdout.slice(0, 300),
          stderr: r.stderr.slice(0, 300),
        },
      );
    }

    // ---------------------------------------------------------------------
    // [3] validate registry
    // ---------------------------------------------------------------------
    if (!halted) {
      const r = runCli("scripts/validate_source_registry.mjs", [
        "--input", registryOut,
      ]);
      record(
        "validate registry",
        r.code === 0,
        r.code === 0 ? "validator passed" : `exit=${r.code}`,
        r.code === 0 ? null : {
          stdout: r.stdout.slice(0, 300),
          stderr: r.stderr.slice(0, 300),
        },
      );
    }

    // ---------------------------------------------------------------------
    // [4] build + --merge-with
    // ---------------------------------------------------------------------
    const registryMerged = join(work, "source-registry-merged.json");
    if (!halted) {
      const r = runCli("scripts/build_source_registry.mjs", [
        "--input", exampleDiscovery,
        "--out", registryMerged,
        "--mode", "build",
        "--limit", "20",
        "--merge-with", registryOut,
      ]);
      record(
        "build + --merge-with",
        r.code === 0,
        r.code === 0 ? `wrote ${registryMerged}` : `exit=${r.code}`,
        r.code === 0 ? null : {
          stderr: r.stderr.slice(0, 300),
        },
      );
    }

    // ---------------------------------------------------------------------
    // [5] validate merged registry
    // ---------------------------------------------------------------------
    if (!halted) {
      const r = runCli("scripts/validate_source_registry.mjs", [
        "--input", registryMerged,
      ]);
      record(
        "validate merged registry",
        r.code === 0,
        r.code === 0 ? "validator passed" : `exit=${r.code}`,
        r.code === 0 ? null : {
          stdout: r.stdout.slice(0, 300),
          stderr: r.stderr.slice(0, 300),
        },
      );
    }

    // ---------------------------------------------------------------------
    // [6] collect gate dry-run on example (likely 0 approved; tolerate)
    // ---------------------------------------------------------------------
    const collectBatch = join(work, "source-documents.batch.json");
    if (!halted) {
      const r = runCli("scripts/collect_discovered_resources.mjs", [
        "--input", exampleDiscovery,
        "--out", collectBatch,
        "--source-registry", registryMerged,
        "--limit", "5",
        "--dry-run", "yes",
      ]);
      let details = `exit=${r.code}`;
      if (r.code === 0) {
        try {
          const batch = await readJsonFile(collectBatch);
          const sr = batch.summary?.sourceRegistry ?? {};
          details = `gate enabled, approvedSources=${
            sr.approvedSources ?? "?"
          } eligible=${batch.summary?.eligible ?? "?"} skipped=${
            batch.summary?.skipped ?? "?"
          } (0-approved on example fixture is tolerated)`;
        } catch (err) {
          details += ` (parse error: ${err.message})`;
        }
      }
      record(
        "collect gate dry-run (example discovery)",
        r.code === 0,
        details,
        r.code === 0 ? null : { stderr: r.stderr.slice(0, 300) },
      );
    }

    // ---------------------------------------------------------------------
    // [7] approved gate fixture (1 approved URL → expect approvedSources=1, dryRun>=1)
    // ---------------------------------------------------------------------
    const approvedDiscovery = join(work, "approved-discovery.json");
    const approvedRegistry = join(work, "approved-registry.json");
    const approvedBatch = join(work, "approved-batch.json");
    if (!halted) {
      await writeJsonFile(approvedDiscovery, [
        makeDiscoveryEntry({
          id: "smoke-a",
          url: "https://example.com/approved",
        }),
      ]);
      await writeJsonFile(approvedRegistry, [
        makeRegistryEntry({
          sourceId: "src-smoke-001",
          sourceUrl: "https://example.com/approved",
          reviewStatus: "approved_for_import",
          title: "Smoke approved fixture",
        }),
      ]);
      const r = runCli("scripts/collect_discovered_resources.mjs", [
        "--input", approvedDiscovery,
        "--out", approvedBatch,
        "--source-registry", approvedRegistry,
        "--limit", "5",
        "--dry-run", "yes",
      ]);
      let passed = r.code === 0;
      let details = `exit=${r.code}`;
      if (passed) {
        try {
          const batch = await readJsonFile(approvedBatch);
          const sr = batch.summary?.sourceRegistry ?? {};
          const approvedSources = sr.approvedSources ?? 0;
          const dryRunCount = batch.summary?.dryRun ?? 0;
          const eligible = batch.summary?.eligible ?? 0;
          details = `approvedSources=${approvedSources} eligible=${eligible} dryRun=${dryRunCount}`;
          if (approvedSources !== 1 || dryRunCount < 1) {
            passed = false;
            details += " (UNEXPECTED — expected approvedSources=1, dryRun>=1)";
          }
        } catch (err) {
          passed = false;
          details += ` (parse error: ${err.message})`;
        }
      }
      record(
        "approved gate fixture (1 approved URL)",
        passed,
        details,
        passed ? null : { stderr: r.stderr.slice(0, 300) },
      );
    }

    // ---------------------------------------------------------------------
    // [8] normalize gate fixture (1 approved + 1 pending + 1 not-in-registry)
    // ---------------------------------------------------------------------
    const normalizeBatch = join(work, "normalize-batch.json");
    const normalizeRegistry = join(work, "normalize-registry.json");
    const normalizeOut = join(work, "normalized.json");
    if (!halted) {
      await writeJsonFile(normalizeRegistry, [
        makeRegistryEntry({
          sourceId: "src-smoke-approved",
          sourceUrl: "https://example.com/approved",
          reviewStatus: "approved_for_import",
          title: "Smoke approved",
        }),
        makeRegistryEntry({
          sourceId: "src-smoke-pending",
          sourceUrl: "https://example.com/pending",
          reviewStatus: "pending_review",
          title: "Smoke pending",
        }),
      ]);
      await writeJsonFile(normalizeBatch, {
        batchId: "smoke-batch",
        createdAt: "2026-05-16T00:00:00.000Z",
        source: SMOKE_VERSION,
        summary: { totalInput: 3, eligible: 3 },
        items: [
          makeBatchSourceDocItem({
            id: "approved",
            url: "https://example.com/approved",
          }),
          makeBatchSourceDocItem({
            id: "pending",
            url: "https://example.com/pending",
          }),
          makeBatchSourceDocItem({
            id: "not-in-registry",
            url: "https://example.com/not-in-registry",
          }),
        ],
      });
      const r = runCli("scripts/normalize_collected_sources.mjs", [
        "--input", normalizeBatch,
        "--out", normalizeOut,
        "--source-registry", normalizeRegistry,
        "--mode", "rule-based",
        "--limit", "10",
      ]);
      let passed = r.code === 0;
      let details = `exit=${r.code}`;
      if (passed) {
        try {
          const out = await readJsonFile(normalizeOut);
          const drafts = out.summary?.drafts ?? 0;
          const skipped = out.summary?.skipped ?? 0;
          const sr = out.summary?.sourceRegistry ?? {};
          details =
            `drafts=${drafts} skipped=${skipped}` +
            ` approvedSources=${sr.approvedSources ?? "?"}` +
            ` skippedNotApproved=${sr.skippedSourceNotApprovedForImport ?? "?"}` +
            ` skippedNotInRegistry=${sr.skippedNotInSourceRegistry ?? "?"}`;
          if (drafts !== 1 || skipped < 2) {
            passed = false;
            details += " (UNEXPECTED — expected drafts=1 + skipped>=2)";
          }
        } catch (err) {
          passed = false;
          details += ` (parse error: ${err.message})`;
        }
      }
      record(
        "normalize gate fixture (1 approved + 1 pending + 1 not-in-registry)",
        passed,
        details,
        passed ? null : { stderr: r.stderr.slice(0, 300) },
      );
    }

    // ---------------------------------------------------------------------
    // [9] review prepare-review fixture（接 normalize output → reviewer 工作介面）
    // ---------------------------------------------------------------------
    const reviewedOut = join(work, "reviewed-questions.json");
    if (!halted) {
      const r = runCli("scripts/review_normalized_questions.mjs", [
        "--input", normalizeOut,
        "--out", reviewedOut,
        "--mode", "prepare-review",
        "--limit", "10",
        "--overwrite", "yes",
      ]);
      let passed = r.code === 0;
      let details = `exit=${r.code}`;
      if (passed) {
        try {
          const out = await readJsonFile(reviewedOut);
          const queued = out.summary?.queued ?? 0;
          const eligible = out.summary?.eligible ?? 0;
          details = `eligible=${eligible} queued=${queued}`;
          if (queued < 1) {
            passed = false;
            details += " (UNEXPECTED — expected queued>=1)";
          }
        } catch (err) {
          passed = false;
          details += ` (parse error: ${err.message})`;
        }
      }
      record(
        "review prepare-review fixture",
        passed,
        details,
        passed ? null : { stderr: r.stderr.slice(0, 300) },
      );
    }

    // ---------------------------------------------------------------------
    // [10] reviewer-approved transform + validate-reviewed fixture
    //      （在 smoke script 內以程式 fake-approve 第一筆 → 跑 validator）
    // ---------------------------------------------------------------------
    const reviewedApprovedOut = join(work, "reviewed-questions.approved.json");
    const reviewValidationOut = join(work, "review-validation.json");
    if (!halted) {
      let passed = false;
      let details = "";
      try {
        const reviewedBatch = await readJsonFile(reviewedOut);
        const approvedBatch = fakeApproveFirstReviewItem(reviewedBatch);
        await writeJsonFile(reviewedApprovedOut, approvedBatch);
        const r = runCli("scripts/review_normalized_questions.mjs", [
          "--input", reviewedApprovedOut,
          "--out", reviewValidationOut,
          "--mode", "validate-reviewed",
        ]);
        passed = r.code === 0;
        details = `exit=${r.code}`;
        if (passed) {
          const out = await readJsonFile(reviewValidationOut);
          const approvedClaimed = out.summary?.approvedClaimed ?? 0;
          const passedValidation = out.summary?.passedValidation ?? 0;
          const failedValidation = out.summary?.failedValidation ?? 0;
          details =
            `approvedClaimed=${approvedClaimed}` +
            ` passedValidation=${passedValidation}` +
            ` failedValidation=${failedValidation}`;
          if (passedValidation < 1 || failedValidation > 0) {
            passed = false;
            details +=
              " (UNEXPECTED — expected passedValidation>=1 + failedValidation=0)";
          }
        } else {
          details += ` stderr=${r.stderr.slice(0, 200)}`;
        }
      } catch (err) {
        passed = false;
        details = `transform/validate error: ${err.message}`;
      }
      record(
        "validate-reviewed fixture (1 fake-approved item)",
        passed,
        details,
        null,
      );
    }

    // ---------------------------------------------------------------------
    // [11] approve reviewed preview fixture
    //      （/tmp target=[]，preview mode 不寫 target）
    // ---------------------------------------------------------------------
    const targetQuestionsPath = join(work, "target-questions.json");
    const approvedPreviewOut = join(work, "approved-preview.json");
    let targetHashBefore = null;
    if (!halted) {
      let passed = false;
      let details = "";
      try {
        await writeJsonFile(targetQuestionsPath, []);
        targetHashBefore = await hashFile(targetQuestionsPath);
        const r = runCli("scripts/approve_reviewed_questions.mjs", [
          "--reviewed", reviewedApprovedOut,
          "--validation", reviewValidationOut,
          "--target", targetQuestionsPath,
          "--out", approvedPreviewOut,
          "--mode", "preview",
          "--limit", "10",
        ]);
        passed = r.code === 0;
        details = `exit=${r.code}`;
        if (passed) {
          const out = await readJsonFile(approvedPreviewOut);
          const readyToAppend = out.summary?.readyToAppend ?? 0;
          const duplicateIds = out.summary?.duplicateIds ?? 0;
          details = `readyToAppend=${readyToAppend} duplicateIds=${duplicateIds}`;
          if (readyToAppend < 1) {
            passed = false;
            details += " (UNEXPECTED — expected readyToAppend>=1)";
          }
        } else {
          details += ` stderr=${r.stderr.slice(0, 300)}`;
        }
      } catch (err) {
        passed = false;
        details = `error: ${err.message}`;
      }
      record(
        "approve reviewed preview fixture (target=[], preview only)",
        passed,
        details,
        null,
      );
    }

    // ---------------------------------------------------------------------
    // [12] assemble practice paper preview fixture
    //      （/tmp papers=[]，preview mode 不寫 papers）
    // ---------------------------------------------------------------------
    const smokeQuestionsPath = join(work, "questions-for-paper.json");
    const smokePapersPath = join(work, "papers.json");
    const paperPreviewOut = join(work, "practice-paper-preview.json");
    let papersHashBefore = null;
    if (!halted) {
      let passed = false;
      let details = "";
      try {
        await writeJsonFile(smokeQuestionsPath, [makeSmokeExamQuestion()]);
        await writeJsonFile(smokePapersPath, []);
        papersHashBefore = await hashFile(smokePapersPath);
        const r = runCli("scripts/assemble_practice_paper.mjs", [
          "--questions", smokeQuestionsPath,
          "--papers", smokePapersPath,
          "--out", paperPreviewOut,
          "--mode", "preview",
          "--paper-id", "smoke-paper-001",
          "--limit", "20",
        ]);
        passed = r.code === 0;
        details = `exit=${r.code}`;
        if (passed) {
          const out = await readJsonFile(paperPreviewOut);
          const paper = out.paper ?? out.previewPaper ?? out;
          const paperId =
            paper?.examPaperId ?? out.paperId ?? out.examPaperId ?? null;
          const sections = paper?.sections ?? out.sections ?? [];
          const sectionCount = Array.isArray(sections) ? sections.length : 0;
          details = `examPaperId=${paperId ?? "?"} sections=${sectionCount}`;
          if (paperId !== "smoke-paper-001" || sectionCount < 1) {
            passed = false;
            details +=
              " (UNEXPECTED — expected examPaperId='smoke-paper-001' + sections>=1)";
          }
        } else {
          details += ` stderr=${r.stderr.slice(0, 300)}`;
        }
      } catch (err) {
        passed = false;
        details = `error: ${err.message}`;
      }
      record(
        "assemble paper preview fixture (papers=[], preview only)",
        passed,
        details,
        null,
      );
    }

    // ---------------------------------------------------------------------
    // Safety checks
    // ---------------------------------------------------------------------
    const safetyChecks = [];
    for (const f of FORMAL_FILES) {
      const after = await hashFile(join(REPO_ROOT, f));
      safetyChecks.push({
        name: `${f} unchanged`,
        passed: formalBefore[f] === after,
        details:
          formalBefore[f] === after
            ? `sha256 stable`
            : `MODIFIED — before=${formalBefore[f]?.slice(0, 12)} after=${after?.slice(0, 12)}`,
      });
    }
    // forbidden generated paths must remain in the same existence state
    const forbiddenChanges = [];
    for (const f of FORBIDDEN_GENERATED_PATHS) {
      const after = await fileExistsAtAll(join(REPO_ROOT, f));
      if (after !== forbiddenBefore[f]) {
        forbiddenChanges.push(
          `${f}: before=${forbiddenBefore[f]} after=${after}`,
        );
      }
    }
    safetyChecks.push({
      name: "no repo generated JSON appeared/disappeared",
      passed: forbiddenChanges.length === 0,
      details:
        forbiddenChanges.length === 0
          ? `checked ${FORBIDDEN_GENERATED_PATHS.length} paths; existence state stable`
          : `CHANGED: ${forbiddenChanges.join("; ")}`,
    });
    // approve preview target hash stable
    if (targetHashBefore !== null) {
      const after = await hashFile(targetQuestionsPath);
      safetyChecks.push({
        name: "approve preview target-questions.json hash stable",
        passed: targetHashBefore === after,
        details:
          targetHashBefore === after
            ? "sha256 stable (preview mode did not touch target)"
            : `MODIFIED — before=${targetHashBefore?.slice(0, 12)} after=${after?.slice(0, 12)}`,
      });
    }
    // assemble preview papers hash stable
    if (papersHashBefore !== null) {
      const after = await hashFile(smokePapersPath);
      safetyChecks.push({
        name: "assemble preview papers.json hash stable",
        passed: papersHashBefore === after,
        details:
          papersHashBefore === after
            ? "sha256 stable (preview mode did not touch papers)"
            : `MODIFIED — before=${papersHashBefore?.slice(0, 12)} after=${after?.slice(0, 12)}`,
      });
    }
    // workspace must live under OS tmpdir
    safetyChecks.push({
      name: "all smoke output under OS tmpdir",
      passed: work.startsWith(tmpdir()),
      details: work.startsWith(tmpdir())
        ? `${work} ⊂ ${tmpdir()}`
        : `${work} is OUTSIDE ${tmpdir()}`,
    });

    // ---------------------------------------------------------------------
    // Print results
    // ---------------------------------------------------------------------
    process.stdout.write("Checks:\n");
    for (const c of checks) {
      const tag = c.passed ? "PASS" : "FAIL";
      process.stdout.write(`  [${tag}] ${c.name} — ${c.details}\n`);
      if (!c.passed && c.failure) {
        const blob = JSON.stringify(c.failure);
        process.stdout.write(
          `         failure: ${blob.slice(0, 600)}${blob.length > 600 ? "…" : ""}\n`,
        );
      }
    }
    process.stdout.write("\nSafety:\n");
    for (const s of safetyChecks) {
      const tag = s.passed ? "OK  " : "FAIL";
      process.stdout.write(`  [${tag}] ${s.name} — ${s.details}\n`);
    }

    const checksOk = checks.every((c) => c.passed);
    const safetyOk = safetyChecks.every((s) => s.passed);
    finalOk = checksOk && safetyOk;

    process.stdout.write(`\noverall: ${finalOk ? "PASS" : "FAIL"}\n`);
    process.stdout.write(
      `\nReminder: this smoke check is offline-only.\n` +
        `  - It does not contact Brave / OpenAI / any external service.\n` +
        `  - It does not approve any source or question (reviewStatus stays as written in fixtures).\n` +
        `  - It does not write to data/p3-example-questions.json / data/exam-papers.example.json.\n` +
        `  - approve / assemble run preview only — no --mode write / --write yes.\n` +
        `  - It does not switch /quiz to imported questions.\n` +
        `  - Pass only means tooling + runbook commands stay aligned.\n` +
        `  - Smoke PASS does NOT substitute Codex preview review before any real write.\n`,
    );
  } catch (err) {
    unexpectedErr = err;
  } finally {
    // ---------------------------------------------------------------------
    // Cleanup /tmp working dir（即使失敗 / 未預期 exception 都要清掉）
    // ---------------------------------------------------------------------
    if (work) {
      try {
        await rm(work, { recursive: true, force: true });
      } catch {
        /* ignore cleanup errors */
      }
    }
  }

  if (unexpectedErr) {
    process.stderr.write(
      `[runbook_smoke_check] unexpected error during smoke run\n  ${
        unexpectedErr?.stack ?? unexpectedErr
      }\n`,
    );
    process.exit(1);
  }
  process.exit(finalOk ? 0 : 1);
}

main().catch((err) => {
  // Last-resort handler: main()'s own try/finally already cleans /tmp; this catches
  // anything thrown after finally (extremely rare; e.g. exit-related races).
  process.stderr.write(
    `[runbook_smoke_check] unexpected outer error\n  ${err?.stack ?? err}\n`,
  );
  process.exit(1);
});
