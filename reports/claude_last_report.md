# Claude Code 回報 · P3-6-B 第一刀：Exam Session localStorage 持久化與基本操作

任務日期：2026-05-08
任務性質：**程式碼實作**——P3-6-B 第一刀（B-1 + B-2）。**Codex 暫停期由 Claude 自測**，使用者手動驗收，5/12 後 Codex 完整總驗收。本輪只做 localStorage session、繼續作答 / 重新測驗 / 直接交卷、基本結果頁；**未做** 完整每題詳解 / 錯題複習頁 / 正式歷史紀錄頁 / 計時器 / Speaking / TTS / 錄音 / STT / AI API / crawler；**未動** `lib/types.ts` / `data/*.json`、未新增依賴 / 處理 npm audit、未部署、未新增後端 / DB / 登入。

## 【本輪修改摘要】

`/quiz` 從「一次性 React state」升級為「可保存進度的 Exam Session 第一版」。新增 `lib/examSessionStorage.ts` helper（localStorage key `cambridge-starters-practice:quiz-session:v1`、`schemaVersion = 1`、createEmpty / load / save / clear / isCompatible 純函式 + 完整 try/catch + runtime shape 驗證）。`components/QuizPlay.tsx` 三個獨立 state（currentIndex / answers / submitted）合併為單一 `session` state；hydration 後嘗試從 localStorage 恢復；session 變更後自動寫回 localStorage。

新增三個使用者操作：

- **繼續作答**：自動恢復進度 + emerald 小提示「🔁 已恢復上次作答進度」（首次點選任何答案後消失）。
- **重新測驗**：題目卡下方灰底 chip 按鈕（無 confirm dialog），清 localStorage + 回第一題。
- **直接交卷**：題目卡下方 amber chip 按鈕，submitted + submittedAt 寫入後立即進結果頁。

結果頁改寫：「答對 N / M」+「已作答 X / M」+「未作答 M-X 題」雙欄統計 + 鼓勵文案 + 重新測驗按鈕。

`PROJECT_ROADMAP.md` P3-6-B 從單一 ⬜ 拆為 5 個子分區：B-1（6 條 ✅）/ B-2（7 條 ✅）/ B-3 完整結果頁與每題詳解（4 條 ⬜）/ B-4 錯題詳解與錯題複習（3 條 ⬜）/ B-5 計時器（1 條 ✅ 第一版不計時 + 1 條 ⬜ 未來計時器）；P3-6-B 整體 ⬜ → 🟡。`README.md` `/quiz` 條目補 localStorage 與基本操作說明。

`npm run lint` / `typecheck` / `build` 全綠（路由 88 不變）+ dev smoke test 全部命中。

## 【修改檔案清單】

新增 1 份：

- `lib/examSessionStorage.ts`（150 行）：localStorage helper。

修改 4 份：

- `components/QuizPlay.tsx`：state 結構改為 `session: QuizSession`；hydration useEffect（queueMicrotask 包設定 state 避開 React 19 lint 規則）+ persistence useEffect（gated by `hydrated` flag 避免 race）；新增 `restoredHint` 提示；`handleRestart` 加 `clearSession()`；新增 `handleSubmitNow`；ResultView 增加 `answeredCount` 統計欄。
- `app/quiz/page.tsx`：`<QuizPlay>` 補 `paperId={paper.examPaperId}` prop；JSX 條件略加 `paper && questions.length > 0` 補 paper 存在性。
- `PROJECT_ROADMAP.md`：P3-6-B 拆 5 個子分區（B-1 ✅ + B-2 ✅ + B-3 ⬜ + B-4 ⬜ + B-5 部分 ✅ 部分 ⬜）；P3-6-B 整體 ⬜ → 🟡；變更紀錄追加 2026-05-08。
- `README.md`：「目前功能」`/quiz` 條目補 localStorage 與基本操作三段（自動保存 / 三個操作按鈕 / 結果頁雙欄統計）。
- `reports/claude_last_report.md`：本回報。

未動：`lib/types.ts` / `lib/data.ts` / 任何 `data/*.json` / 任何 `app/review/*` 路由 / `components/PicturePractice.tsx` / `components/VocabularyCard.tsx` / `components/ReviewHubCard.tsx` / `components/BackToHome.tsx` / `docs/*` 任一檔 / `source_materials/*` / `AI_DEV_WORKFLOW.md` / `AGENTS.md` / `CLAUDE.md` / `package.json` / 依賴 / 既有圖片 / 音檔 / SVG。

## 【核心邏輯說明】

### 1. SSR-safe hydration（避開 React 19 `react-hooks/set-state-in-effect`）

關鍵設計取捨。React 19 的 `react-hooks/set-state-in-effect` 規則（在 eslint-plugin-react-hooks `recommended` preset 中、本專案 `eslint-config-next` 已啟用）禁止在 effect body 中**同步**呼叫 setState。本專案既有 `QuizImage` 元件處理此規則的模式：把 setState 放在 `probe.onload` 等**非同步 callback** 中。

本輪 localStorage hydration 沿用此模式——把 setState 放進 `queueMicrotask` 的非同步 callback：

```ts
useEffect(() => {
  let cancelled = false;
  queueMicrotask(() => {
    if (cancelled) return;
    const stored = loadSession();
    if (stored && isCompatibleSession(stored, paperId, questions)) {
      setSession(stored);  // 在 microtask 內，非同步 callback，不觸發規則
      ...
    }
    setHydrated(true);
  });
  return () => { cancelled = true; };
}, [paperId, questions]);
```

`useState` 的 init function 同時在 server 與 client 第一次 render 跑——兩邊都得到 `createEmptySession(paperId, questions)` 的乾淨 session（visible HTML 不含 timestamp / sessionId 等動態欄位，所以不會 hydration mismatch）。Hydration 完成後，microtask 才嘗試從 localStorage 恢復。

### 2. Persistence race 防護（hydrated flag）

如果只寫 `useEffect(() => saveSession(session), [session])` 會出錯——第一次 render 後 effect 立即把空 session 寫入 localStorage，蓋掉舊資料；之後 microtask 再讀已被蓋掉的舊資料時就讀不到了。

修正：第二個 effect 用 `hydrated` flag 把關，hydration 完成（不管是否真的恢復）才開始 persistence：

```ts
useEffect(() => {
  if (!hydrated) return;
  saveSession(session);
}, [session, hydrated]);
```

時序：
1. 第一次 render：兩個 effect 都註冊。
2. Hydration effect：schedule microtask。Persistence effect：`!hydrated`，early return。
3. Microtask 跑：`loadSession()` 讀到舊資料 → setSession（若相容） + setHydrated(true)。
4. 重新 render：Persistence effect 跑，把（可能恢復後的）session 寫回 localStorage。

### 3. `isCompatibleSession` 的不相容判定

四種不相容情境，任一不符即丟棄舊 session：

| 不相容情境 | 觸發條件 |
| --- | --- |
| schemaVersion 不符 | 未來升級 schemaVersion 後，舊資料自動失效 |
| paperId 不符 | 換考卷模板後，不混用舊 session |
| questionOrder 長度不符 | 題目數變動 |
| questionOrder 元素不符 | 題目順序或 id 變動 |

加上 `loadSession` 內部的 try/catch（JSON parse 失敗 / SecurityError / QuotaExceeded）+ `isQuizSessionShape` runtime shape 驗證（schema 欄位型別 + `answers` value 必為字串），總共 6 道防線守護「壞資料不讓頁面 crash」邊界。

### 4. Session 欄位精簡（與 `ExamSessionState` 對齊但不全集）

`lib/types.ts` 的 `ExamSessionState` 完整欄位：

```
examSessionId / examPaperId / questionOrder / answers / currentIndex /
submitted / score / wrongQuestionIds / createdAt / updatedAt / schemaVersion
```

第一刀只存其中 8 個欄位（精簡為 `QuizSession`）：

```
schemaVersion / paperId / questionOrder / currentIndex / answers /
submitted / startedAt / updatedAt / submittedAt(可選)
```

刻意省略：

- `examSessionId`：第一刀只有單一 active session、無歷史紀錄頁，不需要唯一識別碼。
- `score` / `wrongQuestionIds`：屬 P3-6-B-3 完整結果頁範圍；目前結果頁從 session.answers 即時計算，不快取。

未來 P3-6-B-3+ 動工時，把這些欄位逐步加入 + 遞增 `schemaVersion = 2` + 寫對應 migration。本輪 schema 設計**前向相容**——`isCompatibleSession` 中的 `schemaVersion === 1` 檢查會在升 v2 後自動丟棄舊 v1 session（使用者進度會掉，但不 crash）。

### 5. 三個使用者操作對齊任務單需求

| 任務需求 | 實作 |
| --- | --- |
| 第一次進 `/quiz` 沒有 session 時建立新 session | `useState(() => createEmptySession(...))` 預設值 |
| 作答後 answers / currentIndex 自動保存 | persistence useEffect 監聽 `session` |
| 重新整理 / 重開分頁可恢復 currentIndex / answers / submitted | hydration useEffect 從 localStorage 載入 |
| 不相容 session 自動丟棄、不 crash | `isCompatibleSession` + try/catch + shape 驗證 |
| 「繼續作答」小提示 | `restoredHint` flag + emerald 系小條 banner（首次點選後消失） |
| 「重新測驗」按鈕 | `handleRestart` 清 session + 回第一題（無 confirm dialog） |
| 「直接交卷」按鈕 | `handleSubmitNow` 設 submitted + submittedAt |
| 結果頁顯示已作答 / 未作答 | ResultView 接 `answeredCount` prop，計算 `unansweredCount = total - answeredCount` |
| 完成畫面「重新開始」清 localStorage | `handleRestart` 共用 + `clearSession()` 顯式呼叫（雖然 persistence useEffect 也會覆寫，但顯式呼叫表達意圖） |

### 6. SSR / 第一次 render 不會顯示 restoredHint

`restoredHint` 預設 false。SSR 與第一次 client render 都不顯示「已恢復」banner（visible HTML 確認）。Microtask 跑完才有可能 setRestoredHint(true)；只有當恢復的 session 實際有作答內容（`currentIndex > 0` 或 answers 非空 或 submitted）時才顯示。空 session 的恢復不顯示 hint（避免「看到 hint 但實際沒進度」的混淆）。

### 7. 沒做的事（嚴守任務單禁止清單）

- 沒做完整每題詳解（屬 P3-6-B-3）
- 沒做錯題複習頁（屬 P3-6-B-4）
- 沒做正式歷史紀錄頁
- 沒做計時器（屬 P3-6-B-5）
- 沒做 Speaking / TTS / 錄音 / STT / AI API / crawler
- 沒下載官方 PDF / 圖片 / 音檔
- 沒複製官方題目 / 歷屆題
- 沒新增題目
- 沒修改 `data/*.json`
- 沒大改 `lib/types.ts`（完全沒動）
- 沒做 P3-9-B schema / metadata 大升級
- 沒做 P3-2-B 轉換工具
- 沒新增依賴
- 沒處理 npm audit
- 沒部署 / 後端 / DB / 登入

## 【測試結果】

- `npm run lint` → **通過**（0 警告 0 錯誤；`react-hooks/set-state-in-effect` 規則沒命中——`queueMicrotask` 包成非同步 callback 模式有效）。
- `npm run typecheck` → **通過**（exit 0）。
- `npm run build` → **通過**（路由 88 不變，全 SSG / Static、`Generating static pages 88/88`）。

`lib/examSessionStorage.ts` helper 邏輯透過 Node mock 8 項單測通過：

| # | 測試 | 結果 |
| --- | --- | --- |
| 1 | createEmptySession 結構正確 | ✓ |
| 2 | isCompatibleSession 同 paper / 同題目 | ✓ |
| 3 | isCompatibleSession 不同 paperId | ✓ false |
| 4 | isCompatibleSession 重排 questionOrder | ✓ false |
| 5 | isCompatibleSession 不同 schemaVersion | ✓ false |
| 6 | isCompatibleSession 題目少一個 | ✓ false |
| 7 | JSON 序列化 / 反序列化後仍相容 | ✓ |
| 8 | bad JSON 處理（throw 由 try/catch 接，return null） | ✓ |

## 【手動檢查結果】

> **使用者請依下方清單在 Mac 本機 + 平板區網 IP 上手動驗收。Codex 5/12 恢復後再做完整總驗收。**

Claude 自測（dev server smoke test）通過：

| # | 自動驗收項 | 結果 |
| --- | --- | --- |
| 1 | 8 條路由 200（`/`、`/review`、`/review/picture`、`/review/words`、`/review/letter/a`、`/review/word/apple`、`/review/word/jump`、`/quiz`） | ✓ |
| 2 | `/quiz` SSR 第 1 題仍是 listening：徽章 Listening / 聽力練習 / Part 3：聽音選圖 | ✓ |
| 3 | 題目卡下方「直接交卷」+「重新測驗」按鈕 visible HTML | ✓ |
| 4 | RSC payload 含 paperId `starters-mock-001` | ✓ |
| 5 | 首次進入 visible HTML **不**含「已恢復上次作答進度」（初始空 session） | ✓ |
| 6 | 頁首練習版聲明「目前為練習版，題型逐步對齊正式 Cambridge Starters」 | ✓ |
| 7 | `/review/word/apple` 翻牌 + 跨字母 prev=ant / next=baby | ✓ |
| 8 | dev log 無 error / hydration / warn 訊息 | ✓ |

需要使用者手動驗收（瀏覽器互動、無法純 SSR 測）：

1. **第一次打開 `/quiz` 正常**：應看到 Listening Section 1 + Part 3 + 第 1 題（音檔準備中文字 + 4 個選項）。
2. **作答幾題後重新整理**：點選擇答案 → 下一題 → 答幾題 → 按 F5 / 重新整理。**預期**：頁面回到原作答的最後一題，已選擇的答案仍標示，頂端顯示「🔁 已恢復上次作答進度」小提示。
3. **關掉分頁再打開**：作答到中間 → 關分頁 → 重開 → `/quiz`。**預期**：同上，進度與 hint 都恢復。
4. **首次點選任何答案後 hint 消失**：在恢復狀態下點任何答案，emerald 提示應立刻消失。
5. **重新測驗**：按題目卡下方灰底「🔁 重新測驗」。**預期**：立即清掉 localStorage（DevTools Application → Local Storage 應該為空）+ 回第一題 + answers 清空 + submitted = false + restored hint 消失。**無 confirm dialog**（依任務單）。
6. **直接交卷**：作答 1~2 題後按 amber 系「📝 直接交卷」。**預期**：立即進結果頁，顯示「答對 N/M 題」+「已作答 X/M」+「未作答 M-X 題」+ 鼓勵文案 + 「重新測驗」。已作答 N 應 = X（如果都答對）或 < X（如果答錯）。**未作答的題目算錯**——可看到「未作答的題目算錯；下次可以再試試看～」鼓勵語（僅當 unansweredCount > 0 時顯示）。
7. **完成後重新測驗會清除 session**：結果頁按「🔁 重新測驗」→ 應回到第 1 題、localStorage 清空。
8. **未作答的題目顯示為未作答**：直接交卷時，未答題顯示在「未作答 N 題」紅底欄；計分時不算對。
9. **既有路由回歸**：`/`、`/review`、`/review/picture`、`/review/words`、`/review/word/apple`、`/review/word/jump` 全部不變、互動正常、翻牌功能、看圖練習互動皆無破壞。

驗收建議流程：依序跑 1~8 + 9（單字複習與看圖練習要驗回歸）。如有破壞請直接退回，由 Claude 修正後再驗收。

## 【仍未處理】

- **P3-6-B-3 完整結果頁與每題詳解**（4 條 ⬜）：每題作答 vs 正確答案紅色標錯題、簡單講解、結果留存。
- **P3-6-B-4 錯題詳解與錯題複習**（3 條 ⬜）：再練習錯題入口、獨立錯題複習頁、`wrongQuestionIds` 對齊 ExamSessionState。
- **P3-6-B-5 計時器**（1 條 ⬜）：未來模擬考計時器（可選功能、預設關閉）。
- **P3-7-B / P3-7-C / P3-7-D 全部 ⬜**（官方資源校正 P3-9 模板 / wordlist 對 vocabulary 校正 / sample / mock test toolkit 觀察筆記）。
- **P3-8 全部 ⬜**（AI 仿真題生成流程文件）。
- **P3-9-B / P3-9-C 全部 ⬜**（schema / metadata 實作 / part-specific UI）。
- **P4 Speaking Examiner Agent 全部 ⬜**；`docs/SPEAKING_EXAMINER_AGENT_DESIGN.md` 規劃中文件未建立。
- **P5 完整仿真考試體驗 ⬜**。
- **P2-4C-2B-2 全部 ⬜**（單字閱讀模式、拼字測驗模式、TTS 真實音檔、補圖、聽力 / 句型 / 位置練習）。
- **P3-2-B / P3-3-B / P3-4 / P3-5 全部 ⬜**。
- **P1 兩條可選 housekeeping**。
- `npm audit` 兩個 moderate 警告（任務單禁止處理）。

## 【風險點】

> 給 5/12 恢復後的 Codex 與下一輪 ChatGPT / Claude 特別注意。

1. **`queueMicrotask` 與 React batching**：本輪用 `queueMicrotask` 包 setState 避開 lint 規則。雖然 React 18+ 支援 microtask 內的 batch updates，但這個模式比 `useSyncExternalStore` less canonical。**Codex 驗收時建議檢查**：在低速 / 高負載瀏覽器中是否會看到「先看到空 session 渲染、再閃成恢復後 session」的視覺跳動。**如果使用者實測發現有閃動**，可考慮升級為 `useSyncExternalStore`（更新成本較大，本輪不做）。
2. **localStorage 寫入頻率**：每個 setState 都觸發 persistence useEffect → write localStorage。題目作答 / 切換頁面都會寫。對 SSD / 現代瀏覽器來說 perf 影響微不足道，但理論上若使用者高速狂點，可能 stress localStorage write。**未來 P3-6-B-3 動工時可考慮 debounce**（本輪不做）。
3. **schemaVersion = 1 的前向相容**：未來新增欄位時若不遞增 schemaVersion，舊瀏覽器會用 v1 schema 解新資料，可能 runtime 失敗。**Codex 驗收提醒**：未來 P3-6-B-3+ 動工時遞增到 v2 並寫對應 migration，或 `isCompatibleSession` 直接 reject v1。
4. **`paperId` hard-coded 從 `paper.examPaperId` 讀**：目前 `app/quiz/page.tsx` 只支援單一 paper（`p3ExamplePapers[0]`）。若未來支援多份考卷，需要把 paperId 帶入路由（例如 `/quiz/[paperId]`）並在 `QuizPlay` 用對應 paperId 找對應 session。本輪未做，屬 P3-6-B-3+ / 多卷支援範圍。
5. **localStorage 與 review 區的命名空間獨立**：本輪 key 為 `cambridge-starters-practice:quiz-session:v1`。未來 P4 Speaking session 不應重用此 key——建議 Speaking 用 `cambridge-starters-practice:speaking-session:v1` 等獨立 namespace。本輪未啟動 Speaking，但 key 命名約定建議在 P4 動工前先寫進 PRODUCT_SPEC 或 DATA_SCHEMA。
6. **沒有 confirm dialog 的「重新測驗」**：依任務單明示「不需要 confirm dialog」。但小一使用者可能誤觸——尤其結果頁的「重新測驗」與作答中的「重新測驗」按鈕視覺類似。**使用者實測時注意**：是否有兒童誤觸後失去進度的擔憂；如有，可在 P3-6-B-3 動工時加 confirm（屬下一刀）。
7. **session schema 沒存 `score` / `wrongQuestionIds`**：每次進結果頁都從 `session.answers` 即時計算 correctCount / answeredCount。若答題集合大（未來百題級）會有 perf 影響，但小一級別的 7 題到幾十題範圍完全沒問題。Codex 驗收時可不擔心 perf。
8. **`useState` init 在 server / client 跑兩次的時間戳差異**：`createEmptySession` 在 server 與 client 第一次 render 各跑一次，產生不同的 `startedAt` / `updatedAt`。**hydration mismatch 不會發生**——這些 timestamps 沒進 visible HTML。但 server-rendered HTML 攜帶的 timestamps 與 client 的不同，雖然不影響使用者體驗，可能在 React 19 的 hydration 警告中「too verbose」時被誤標。**目前 dev log 無 hydration 警告**，但 Codex 驗收建議再跑一次 build 確認 prod-mode 也沒問題。

## 【後續建議】

1. **使用者本輪手動驗收**：依「【手動檢查結果】」段 9 個檢核點在 Mac 本機 + 平板區網 IP 上跑。重點：流程 2/3（重整 / 重開分頁恢復）、流程 5（重新測驗清 localStorage）、流程 6（直接交卷 + 未作答計入未作答）、流程 9（既有路由全回歸）。
2. **5/12 Codex 恢復後跑功能總驗收**：除了上述使用者測項，請 Codex 重點驗收
   - `lib/examSessionStorage.ts` 6 道防線（try/catch + isQuizSessionShape + 4 種不相容判定）是否完整。
   - `queueMicrotask` 模式在 prod build 是否有 hydration race（多開分頁、慢速網路、快速作答）。
   - localStorage key 命名是否與未來 P4 Speaking / P5 完整模擬考共存無衝突。
3. **下一輪實作建議優先序**（請 ChatGPT 收斂）：
   - 路線 A：**P3-6-B-3 第一刀**——結果頁加每題作答 vs 正確答案 + 簡單講解（用既有 `BaseQuestion.explanation` 欄位）。本輪 helper / session schema 已就位、UI 框架已就位，B-3 是最小增量。
   - 路線 B：**P3-6-B-4 第一刀**——錯題複習頁（從 session.answers 算出錯題清單，獨立路由 `/quiz/wrong` 或 inline mode）。
   - 路線 C：**P3-7-B 動工**（P3-9 模板校正）——配合 P3-7-A 11 條校正清單。
   - 路線 D：**P3-9-B 第一刀**——把 `starterSection` / `starterPart` / `skillFocus` 加入 `lib/types.ts`，補 7 題範例的 metadata。
   - 路線 E：**P2-4C-2B-2 補真實音檔 / 補圖**。
4. **`schemaVersion = 1` 前向設計**：未來 B-3 動工時若新增欄位（例如把 `score` / `wrongQuestionIds` 加進 session），請遞增 `QUIZ_SESSION_SCHEMA_VERSION = 2` + 寫 migration（否則使用者進度會掉）。
5. **`useSyncExternalStore` 重構**（建議下下輪做）：當 localStorage 邏輯複雜度增加時，可重構 `examSessionStorage.ts` 為 `useSyncExternalStore` 模式（subscribe = `storage` event listener、getSnapshot = JSON.parse、getServerSnapshot = null）。本輪 `queueMicrotask` 模式夠用、不必過早優化。
6. **小一使用者誤觸防護**（建議 B-3 動工時做）：「重新測驗」按鈕加長按或雙擊確認、或加 confirm modal、或加 5 秒 cooldown。本輪依任務單明示「無 confirm dialog」，未做。
7. **Speaking session localStorage key 約定**：P4 動工前先在 `docs/SPEAKING_EXAMINER_AGENT_DESIGN.md`（規劃中）定 key 命名規範（例如 `cambridge-starters-practice:speaking-session:v1`），避免與本輪 quiz session key 衝突。

## 【Roadmap 同步檢查】

對照新版 `PROJECT_ROADMAP.md`：

- ✅ **P1**：未動。
- 🟡 **P2**：未動（P2-4C-2B-2 仍 ⬜）。
- 🟡 **P3**：本輪只新增 P3-6-B-1 ✅（6 條）+ P3-6-B-2 ✅（7 條）+ P3-6-B-3 / P3-6-B-4 / P3-6-B-5 三個子分區（4 + 3 + 1 條 ⬜，B-5 含 1 條 ✅「第一版不計時」），P3-6-B 整體 ⬜ → 🟡。
  - ✅ **P3-1 / P3-2-A / P3-3-A / P3-6-A / P3-7-A / P3-9-A**：上輪起維持 ✅，本輪未動。
  - ⬜ **P3-2-B / P3-3-B / P3-4 / P3-5 / P3-7-B / P3-7-C / P3-7-D / P3-8 / P3-9-B / P3-9-C**：本輪未動。
  - ✅ **P3-6-B-1 localStorage Session 持久化**（新增）：6 條任務全 ✅。
  - ✅ **P3-6-B-2 繼續作答 / 重新測驗 / 直接交卷**（新增）：7 條任務全 ✅。
  - ⬜ **P3-6-B-3 完整結果頁與每題詳解**（新增）：4 條任務全 ⬜。
  - ⬜ **P3-6-B-4 錯題詳解與錯題複習**（新增）：3 條任務全 ⬜。
  - 🟡 **P3-6-B-5 計時器**（新增）：1 條 ✅（第一版不計時）+ 1 條 ⬜（未來計時器）。
- ⬜ **P4 / P5**：未動（仍 ⬜）。
- ➕ **目前明確不做**：未動。本輪所有禁止項目皆守住。
- 變更紀錄追加 2026-05-08 一筆。

P3 整體仍 🟡 進行中；P3-6-B 升為 🟡 進行中（B-1 + B-2 完成、B-3 / B-4 / B-5 未開始或部分完成），**符合任務單「不要把 P3-6-B 整體標完成、不要把 P3-6 整體標完成、不要把 P3 整體標完成」要求**。
