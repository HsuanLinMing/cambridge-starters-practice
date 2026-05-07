# Claude Code 回報 · P2-4C-1 小修：README 下一步描述同步

任務日期：2026-05-07
任務性質：純 README 文件小修（單一段落），**未動任何程式碼**。

## 【本輪修改摘要】

修 Codex 指出的唯一文件同步問題：`README.md` 的「下一步」第 1 條仍把「看圖」列為「準備中入口」，但 `/review/picture` 看圖練習第一版已於 P2-4C-1 完成。改為符合現況：

- 第 1 條改名為 **「P2-4C-2 複習中心後續擴充」**。
- 明示「看圖練習第一版（4 選 1 看圖選英文，`/review/picture`）已於 P2-4C-1 完成」。
- 後續工作改為列：看英文選圖第二題型、真實圖片素材、聽力練習、句型練習、位置 / 顏色 / 數量練習、TTS 音檔、補齊更多單字（I / K / L / N / Q / U / V / X / Z）。
- 末段註記改為「翻牌互動已於 P2-4A 完成、複習中心首頁已於 P2-4B 完成、**看圖練習第一版已於 P2-4C-1 完成**，皆不再列入待辦」。

第 2 條（P3 規劃中）完全不動。

`npm run lint` / `typecheck` / `build` 三項全綠，路由總數仍 88，全部 SSG / Static prerender。

## 【修改檔案清單】

修改：

- `README.md`：「下一步」第 1 條整段重寫（單行 markdown bullet），其餘段落（專案介紹 / 技術棧 / 如何啟動 / 在平板上使用 / 目前功能 / 資料夾結構 / 文件索引）皆不動。
- `reports/claude_last_report.md`：本回報檔。

未動：所有 `app/`、所有 `components/`、所有 `lib/`、所有 `data/*.json`、`PROJECT_ROADMAP.md`、`docs/*.md`、`AGENTS.md`、`CLAUDE.md`、`AI_DEV_WORKFLOW.md`、`public/`、`package.json`。

## 【核心邏輯說明】

- **單一原則**：本輪是 Codex 驗收後的「文件描述同步」型修補，目的是把 README 的待辦清單與實際實作狀態對齊，避免讓 Codex / ChatGPT / 共同維護者下次翻 README 時誤以為「看圖」還沒做。
- **改動範圍最小化**：只改第 1 條 bullet 的內文（整段 inline 重寫），不新增章節、不重組「下一步」結構、不改第 2 條（P3）。也不動其他文件——`PROJECT_ROADMAP.md` 的 P2-4C-1 / P2-4C-2 結構與 `docs/PRODUCT_SPEC.md` 的「看圖練習已實作」描述上輪 P2-4C-1 已寫對，本輪不重複動。
- **保留 P2-4C 完成歷程的累積敘述**：原本的 inline 註記「翻牌互動已於 P2-4A 完成、複習中心首頁已於 P2-4B 完成」**保留**，並補上「看圖練習第一版已於 P2-4C-1 完成」。這條累積敘述讓未來新進的 AI agent 翻 README「下一步」就能一眼看到 P2-4 各子階段的完成軌跡，不必去翻 ROADMAP。
- **新增「補齊更多單字（I / K / L / N / Q / U / V / X / Z）」**：原本這條落在已被改寫的 P2-4C 描述末段。新版仍把它列入 P2-4C-2 待辦，避免 Codex 之後問「補單字到底有沒有規劃」。
- **未碰程式碼**：本輪零程式碼變動，build 結果與 P2-4C-1 完全一致（88 條路由），實作面零回歸風險。

## 【新增了哪些能力】

無新功能。本輪純文件對齊。

## 【新增/調整測試】

無。任務單明確只允許改 README，禁止導入測試框架。

## 【測試結果】

自動驗收：

- `npm run lint` → **通過**（0 警告 0 錯誤）。
- `npm run typecheck` → **通過**（exit 0）。
- `npm run build` → **通過**：

  ```
  ▲ Next.js 16.2.5 (Turbopack)
  ✓ Generating static pages using 9 workers (88/88)
  Route (app)
  ┌ ○ /  ├ ○ /_not-found  ├ ○ /quiz  ├ ○ /review
  ├ ● /review/letter/[letter]  (a..z 共 26)
  ├ ○ /review/picture
  ├ ● /review/word/[id]        (54 paths)
  └ ○ /review/words
  ```

  88 條路由不變、全部 SSG / Static prerender，與 P2-4C-1 build 結果完全一致。

文件 grep 驗證（README）：

| 驗證項 | 結果 |
| --- | --- |
| 含「看圖練習第一版」+「P2-4C-1」字樣 | ✓ 命中 |
| 含「看英文選圖」（後續第二題型） | ✓ 命中 |
| 含「P2-4C-2」後續分區 | ✓ 命中 |
| 含「TTS 音檔」 | ✓ 命中 |
| **「下一步」段內**「準備中」字樣（應 0） | ✓ 0 命中 |
| 舊敘述「把『準備中』的看圖」（應 0） | ✓ 0 命中 |

依 runbook 第 4 節，純文件改動可略過 `npm run dev`。

## 【仍未處理】

- P2-4C-2 全部 8 條（看英文選圖 / 真實圖片 / 真實音檔 / 補齊更多單字 / 聽力 / 句型 / 位置 · 顏色 · 數量 / category 補充模式），仍 ⬜。
- P3 6 個子階段全 ⬜，本輪不開工。
- P1 兩條可選 housekeeping。
- `npm audit` 兩個 moderate 警告（任務單禁止處理）。
- `docs/DATA_SCHEMA.md` 對 Question / Exam Session 型別擴充（屬 P3-1）。

## 【後續建議】

1. **請 Codex 用「驗收 9 段」做 P2-4C-1 文件回歸**：只需翻一次 README「下一步」+ ROADMAP「P2-4C / P2-4C-1 / P2-4C-2」+ PRODUCT_SPEC「主要功能（願景）」三處，確認三方對「看圖練習已完成、看英文選圖待做」描述一致。本輪只動 README，預期 ROADMAP 與 PRODUCT_SPEC 上輪 P2-4C-1 已寫對。
2. **下一輪實作建議優先序（請 ChatGPT 收斂 P2-4C-2 任務單）**：
   - 路線 A：**看英文選圖**（4 個圖片選項，題目顯示英文單字）——可直接重用 `buildOptions` helper、`PictureQuestion` 結構、`<VocabularyCard>` 圖片 fallback；改動量最小、最快點亮另一張卡。
   - 路線 B：**聽力練習** + **TTS 自製音檔**（`say -o`）——影響範圍稍大但能解鎖另一張 coming-soon 卡。
   - 路線 C：**補單字到 I / K / L / N / Q / U / V / X / Z** 讓 26 字母全 enabled，順便讓看圖練習題庫變更多元。
3. **README「下一步」未來維護建議**：每次 Px 子階段完成時，把「Px-Y 已於 Px-Y 完成」累積進 inline 註記。當「下一步」段落變過長（例如累積到 5+ 個「已完成」註記）時，可把那些註記移到 ROADMAP 的「變更紀錄」並只在 README 留最近一兩個。本輪累積到 3 條（P2-4A / P2-4B / P2-4C-1），仍可接受。
4. **「累積完成軌跡」 vs 「ROADMAP 唯一真相來源」原則**：README「下一步」的目的是給「快速翻一下就能掌握當前狀態」的讀者；ROADMAP 才是任務粒度的權威來源。兩者描述若日後出現微差，**以 ROADMAP 為準**，README 對齊調整即可，不要反過來改 ROADMAP。
5. **本輪未做的可選優化**：README 的「目前功能」段中 `/review/picture` 描述（見 P2-4C-1 那輪寫入）相當完整，可考慮把「下一步」第 1 條中「看圖練習第一版（4 選 1 看圖選英文，`/review/picture`）」的部分括號簡化為「看圖練習第一版（`/review/picture`）」，避免在 README 兩處重複描述題型細節。本輪不動以維持最小修補。

## 【Roadmap 同步檢查】

對照 `PROJECT_ROADMAP.md`，本輪實際變動：

- ✅ **P1**：未動。
- 🟡 **P2**：仍 🟡 進行中。
  - ✅ **P2-4C-1 看圖練習第一版**：上輪已標 ✅，本輪未動其勾選，只是把 README 的「下一步」描述對齊到「已完成」狀態。
  - 🟡 **P2-4C 階段**：仍 🟡 進行中。
  - ⬜ **P2-4C-2 後續複習類型與素材**：8 條 ⬜，未動。
  - P2-1 / P2-2 / P2-3 / P2-4A / P2-4B 維持 ✅。
- ⬜ **P3**：仍「⬜ 規劃中」，6 個子階段全 ⬜。
- ⬜ **P4 / P5**：仍「⬜ 已併入 P3-x」。
- ➕ **目前明確不做**：未動，本輪未引入登入 / 後端 / 資料庫 / 雲端同步、未真的部署 Vercel、未動 `/quiz`、未進入 P2-4C-2 / P3、未新增 localStorage / 分數保存 / 真實素材 / 依賴 / 測試框架。
- 變更紀錄**未追加**新一筆——本輪是 P2-4C-1 完成後的 README 同步小修，屬細節對齊，不需要在 ROADMAP 變更紀錄留痕（P2-4C-1 上一輪那筆變更紀錄即涵蓋本輪所同步的事實狀態）。

**沒有任何條目從 ⬜ 翻為 ✅ 或 🟡**，符合任務單「不要新增功能」「不要進入 P2-4C-2 實作」「不要進入 P3」「P3 沒有被標成進行中」要求。
