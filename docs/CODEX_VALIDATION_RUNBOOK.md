# Codex 驗收 Runbook

本檔是 Codex 在本專案進行**驗收 / 排查**時的標準手冊。和 `AI_DEV_WORKFLOW.md`、`docs/TASK_ROUTER.md` 一起構成 AI 協作規範。

> 適用對象：Codex CLI 與 Codex 桌面版。
> 不適用對象：Claude Code（請看 `AI_DEV_WORKFLOW.md` 的 Claude 回報格式）。

---

## 1. 驗收前必讀文件

開始任何驗收前，**先讀完**下列文件：

1. `AI_DEV_WORKFLOW.md`
2. `docs/CODEX_VALIDATION_RUNBOOK.md`（本檔）
3. `PROJECT_ROADMAP.md`
4. `README.md`
5. `docs/TASK_ROUTER.md`

依任務性質再決定要不要加讀：

- `docs/PRODUCT_SPEC.md`：涉及功能範圍、MVP 邊界、要不要做某件事的判斷時。
- `docs/DATA_SCHEMA.md`：涉及 `data/*.json` 或 `lib/types.ts` 的修改時。

如果某份文件目前還不存在，請在回報中明確指出，例如：

> 目前尚未找到 `docs/CODEX_VALIDATION_RUNBOOK.md`，本次驗收依 `AI_DEV_WORKFLOW.md` 與 `docs/TASK_ROUTER.md` 進行。

**不要**自己擴張 scope 去把缺的文件補上，那是另一輪 Claude Code 的任務。

---

## 2. Codex 的角色定位

Codex 在本專案是補位角色，三個關鍵字：**第二意見、驗收、排查**。

Codex **應該**做：

- 對 Claude Code 的修改做交叉檢查。
- 跑 `npm run lint` / `typecheck` / `build`，回報結果。
- 對單一檔案 / 單一函式做 review。
- 針對明確的錯誤訊息提供診斷與假設。
- 比較兩種寫法的差異與取捨。

Codex **不應該**做：

- 主動擴大 scope，順手改不相關的檔案。
- 在沒有錯誤證據時主動重構。
- 替 Claude Code 把「下一輪」的功能寫掉。
- 改 `PROJECT_ROADMAP.md` 的階段或勾選狀態（同步交給 ChatGPT）。
- 安裝新依賴，除非任務明確指派。

如果在驗收過程中發現「應該做但本輪沒做」的事，**寫進回報的「後續建議」欄位**，而不是直接動手。

---

## 3. 各階段驗收重點

### P1 基礎架構

重點是「骨架是否成形、規則是否一致」，不是功能完整。

- `npm run lint` / `typecheck` / `build` 全綠。
- 首頁 + `/review` + `/quiz` 三條路由可被請求並回 200。
- 文件骨架是否齊全：`README.md`、`AI_DEV_WORKFLOW.md`、`PROJECT_ROADMAP.md`、`docs/PRODUCT_SPEC.md`、`docs/DATA_SCHEMA.md`、`docs/TASK_ROUTER.md`、`docs/CODEX_VALIDATION_RUNBOOK.md`。
- `data/vocabulary.json`、`data/quizzes.json` 存在且可被 TypeScript import。
- 沒有引入後端 / 資料庫 / 登入相關程式碼。

### P2 單字複習

- `/review` 是否實際讀取 `data/vocabulary.json`。
- 分類切換 / 單字卡 / 發音播放是否符合 `docs/PRODUCT_SPEC.md`。
- 新增的圖片與音檔路徑是否與 JSON 中的欄位對齊。
- 是否誤動到 `/quiz`（應保持骨架不變）。
- 是否新增了與 P2 無關的依賴。

### P3 基礎測驗

- `/quiz` 是否從 `data/quizzes.json` 載入並渲染。
- 一題一頁的流程、即時對錯回饋、結算頁是否齊全。
- 計分邏輯是否抽到純函式（建議在 `lib/` 下，方便未來測試）。
- 答案比對是否處理大小寫 / 前後空白（依 `docs/DATA_SCHEMA.md`）。
- 結果是否仍維持「不上資料庫、不上登入」的限制。

P4 / P5 階段的驗收重點，等到對應 Roadmap 進行時再補。

---

## 4. 基本驗收指令

於專案根目錄依序執行：

```bash
npm run lint
npm run typecheck
npm run build
```

判讀原則：

- **lint**：以 0 警告 0 錯誤為通過。如果有警告，回報中列出，但不要自行修。
- **typecheck**：必須 0 錯誤。如果失敗，把錯誤訊息原樣貼出。
- **build**：必須成功。如果失敗，貼出完整錯誤訊息與卡點，標註是「環境問題」還是「程式問題」。

`npm run dev` **不需要長時間掛著**，人工開瀏覽器看一下三條路由能否載入即可。如果是純文件改動，可以略過 `dev` 檢查。

---

## 5. 檢查清單（每次驗收都跑一遍）

依序檢查，並在回報中明確列出每一項的結果。

### 5.1 與 Roadmap 對齊

- 本輪實作是否落在 `PROJECT_ROADMAP.md` 當前階段？
- 是否動到下一階段以後的事項？

### 5.2 Scope creep 檢查

- 修改檔案清單是否與任務描述一致？
- 是否有看似「順手清理」但其實是無關修改？
- 是否新增了任務沒要求的依賴？

### 5.3 文件語言檢查

- `README.md` / `PROJECT_ROADMAP.md` / `docs/*.md` / `reports/*.md` 是否為繁體中文？
- 新增的文件是否一律繁體中文？
- 中英混排格式是否合理（中英之間半形空白）？

### 5.4 UI 文案檢查

- 畫面上看得到的字是否為繁體中文？
- 有沒有殘留的英文 placeholder（例如 `Lorem ipsum`、`Click me` 之類）？

### 5.5 程式命名檢查

- 變數 / 函式 / component / type / interface / JSON key 是否維持英文？
- 命名是否清楚、可維護？

### 5.6 JSON Schema 檢查

- `data/vocabulary.json` 是否符合 `docs/DATA_SCHEMA.md` 中的 vocabulary 結構？
- `data/quizzes.json` 是否符合 `docs/DATA_SCHEMA.md` 中的 quiz 結構？
- 新增的題型是否已先在 `docs/DATA_SCHEMA.md` 與 `lib/types.ts` 對齊？

### 5.7 不應加入的東西

確認本輪**沒有**加入：

- 後端伺服器（Express、API Routes 處理 DB 連線等）
- 資料庫（Postgres、Supabase、Prisma…）
- 登入 / 認證
- 雲端同步
- AI 出題 / AI 評分
- 為了「未來可能用到」而加的抽象層
- 大量 UI 動畫

如果有發現，列入回報並建議拆掉。

---

## 6. Codex 回報格式

Codex 的工作是**驗收 / 排查**，不是動手實作，因此回報格式與 Claude Code 不同。請使用以下驗收導向 9 段格式：

```
## 【本輪驗收摘要】
## 【驗收檔案清單】
## 【檢查了哪些流程】
## 【發現的問題】
## 【風險點】
## 【建議的最小修補點】
## 【測試結果】
## 【最後結論】
## 【後續建議】
## 【Roadmap 同步檢查】
```

> 注意：上方共 10 個區塊（含【最後結論】單獨佔一塊），因為「結論」要醒目。本檔習慣稱之為「驗收 9 段」，是把【最後結論】視為其他 9 段的最終收斂。

各區塊填寫原則：

- **【本輪驗收摘要】**：兩三句講清楚這輪驗收了什麼、結論是什麼。
- **【驗收檔案清單】**：列出本輪實際讀過 / 檢查過的檔案，例如 `app/page.tsx`、`docs/DATA_SCHEMA.md`、`data/vocabulary.json`。讓事後回頭可追蹤涵蓋面。
- **【檢查了哪些流程】**：對照本檔第 5 節檢查清單，明確列出每一項的結果（通過 / 不通過 / 不適用）。
- **【發現的問題】**：客觀列出**事實**，盡量附檔案路徑與行號。沒有就寫「無」。
- **【風險點】**：本輪沒有立刻爆但值得盯著的東西，例如「JSON 欄位缺少驗證，後續新增題型容易踩雷」。
- **【建議的最小修補點】**：給下一輪 Claude Code 的具體指令（**檔案 / 段落 / 改成什麼**），維持「最小」原則，不要順手列一堆改動。
- **【測試結果】**：`npm run lint` / `typecheck` / `build` 的實際輸出摘要；如有 `dev` 人工檢查也可附上路由 HTTP 狀態。
- **【最後結論】**：必須明確寫出三選一：

  - `驗收通過`
  - `有條件通過`（並在【建議的最小修補點】列出條件）
  - `未通過`（並指出阻擋原因）

- **【後續建議】**：給 ChatGPT / Claude / Codex 下一輪的方向性建議，與【建議的最小修補點】互補（前者是路線、後者是動作）。
- **【Roadmap 同步檢查】**：對照 `PROJECT_ROADMAP.md` 提出建議的勾選變動，**只提建議、不改檔**。

### Codex 驗收的幾條鐵律

- Codex 驗收任務**通常不修改任何檔案**。如果本輪沒改檔，前面對應「動手」的欄位就直接寫「無」是不夠的——本格式已用「驗收檔案清單」「檢查了哪些流程」取代之，請務必填寫。
- 如果只是驗收，**請在「建議的最小修補點」提出下一輪 Claude Code 要做的修補**，而不是自己動手改。
- Codex **不直接更新 `PROJECT_ROADMAP.md`**，只在「Roadmap 同步檢查」欄位提出同步建議，由 ChatGPT 收斂後再交給 Claude Code 實際翻牌。
- 回報一律使用**繁體中文**。技術名稱（Next.js / TypeScript 等）依 `AI_DEV_WORKFLOW.md` 的語言規範保留英文。

### 與 Claude Code 回報格式的差異

| 段落 | Claude Code | Codex |
| --- | --- | --- |
| 摘要 | 【本輪修改摘要】 | 【本輪驗收摘要】 |
| 涉及檔案 | 【修改檔案清單】 | 【驗收檔案清單】 |
| 動作描述 | 【核心邏輯說明】、【新增了哪些能力】、【新增/調整測試】 | 【檢查了哪些流程】、【發現的問題】、【風險點】、【建議的最小修補點】 |
| 結論 | 由「測試結果」與「仍未處理」隱含 | 【最後結論】明確三選一 |
| 共用 | 【測試結果】、【後續建議】、【Roadmap 同步檢查】 | 同左 |

簡言之：Claude 回報強調「我做了什麼」，Codex 回報強調「我看到了什麼、可不可以放行」。

---

## 7. Roadmap 同步規則

- 主檔：`PROJECT_ROADMAP.md`。
- Codex **不直接修改** roadmap 檔案。
- 在「Roadmap 同步檢查」欄位明確列出建議的勾選狀態變動，例如：

  > 建議將 P1 的「`npm run lint` / `typecheck` / `build` 全綠」從 ⬜ 改為 ✅。

- 由 ChatGPT 收斂後，再交由 Claude Code 實際更新檔案。
- 如果發現 roadmap 中漏了本輪實際完成的事，列入「後續建議」，由 ChatGPT 決定要不要新增條目。

---

## 8. 常見排查場景速查

| 症狀 | 第一個要看的東西 |
| --- | --- |
| `npm run build` 失敗，提到 Next.js 設定 | `next.config.ts`、`AGENTS.md`（Next 16 行為差異）|
| TypeScript 報 `Cannot find module '@/...'` | `tsconfig.json` 的 `paths`、實際檔案是否存在 |
| JSON import 失敗 | `tsconfig.json` 的 `resolveJsonModule` |
| Tailwind class 沒生效 | `app/globals.css` 是否載入、`@tailwindcss/postcss` 是否在 `postcss.config.mjs` |
| ESLint 報 `parser` 相關錯 | `eslint.config.mjs`、`eslint-config-next` 版本 |

排查時**只回報診斷與假設**，不要動手改檔；改檔交給 Claude Code（依 `docs/TASK_ROUTER.md` 第 3 節「先 Codex 排查、再 Claude 修正」流程）。
