# Claude Code 回報 · P2-1 圖片 fallback 初次載入修補

任務日期：2026-05-07
任務性質：P2-1 修補單一 issue（圖片 fallback 初次載入），不進入 P2-2，不做新功能。

## 【本輪修改摘要】

修正 `components/VocabularyCard.tsx` 的圖片載入流程：把原本「先 SSR `<img>`、靠 onError 切 fallback」改為「初始狀態即 fallback，client 端用 `new window.Image()` 預載成功才切到真圖」。SSR 階段已驗證不再輸出 `<img src="/images/...">`，第一次開啟 `/review` 時 apple 卡片直接顯示「A + 圖片準備中」，不再殘留 broken image。順手把 `README.md` 的「目前功能」中對 `/review` 的過時描述更新為現況。`npm run lint` / `typecheck` / `build` 三項全綠，dev 三條路由 200，無 hydration mismatch 警告。

## 【修改檔案清單】

- `components/VocabularyCard.tsx`（圖片 fallback 重寫）
- `README.md`（「目前功能」段落 `/review` 一行更新，其他不動）
- `reports/claude_last_report.md`（本回報檔）

未動：`/quiz`、`app/review/page.tsx`、`components/CategoryTabs.tsx`、`components/VocabularyReview.tsx`、`lib/*`、`data/*`、`PROJECT_ROADMAP.md`、`docs/*`、`AGENTS.md`、`CLAUDE.md`、`AI_DEV_WORKFLOW.md`、`package.json`。

## 【核心邏輯說明】

### 問題根因（與 Codex 推測一致）

舊版本 SSR HTML 直接輸出 `<img src="/images/apple.png">`。瀏覽器一拿到 HTML 就開始載入該資源，404 觸發 `error` 事件**很可能在 React hydration 掛上 `onError` handler 之前發生**——因此 `setImageBroken(true)` 永遠不被觸發，第一張卡上殘留 broken image icon。切到下一張或下一個分類後，元件因 `key={current.id}` remount，新的 `<img>` 渲染與 onError 已都在 client 階段，能正確進入 fallback。

### 新流程：「初始 fallback + client 預載」

```tsx
type ImageStatus = "loading" | "ready" | "missing";

const [imageStatus, setImageStatus] = useState<ImageStatus>(() =>
  item.image ? "loading" : "missing",
);

useEffect(() => {
  if (!item.image) return;
  let cancelled = false;
  const probe = new window.Image();
  probe.onload = () => { if (!cancelled) setImageStatus("ready"); };
  probe.onerror = () => { if (!cancelled) setImageStatus("missing"); };
  probe.src = item.image;
  return () => {
    cancelled = true;
    probe.onload = null;
    probe.onerror = null;
  };
}, [item.image]);
```

Render：

```tsx
{imageStatus === "ready" && item.image
  ? <img src={item.image} alt={item.word} ... />
  : <FallbackBlock word={item.word} />}
```

### 為何這樣寫不會被 React 19 lint 抓

`react-hooks/set-state-in-effect` 規則阻擋的是「effect body 內同步呼叫 setState」。本次的 effect body 只做兩件事：建立 `probe` 物件、掛 callback、設 `src`。setState 全部在 `onload` / `onerror` callback 內被呼叫——這是「外部資源同步」場景，正是 React 文件指明 effect 該做的事。Lint 結果驗證：`npm run lint` 0 警告 0 錯誤。

### 為何不會 hydration mismatch

- SSR：`useState` 初始化函式在 server 上跑，根據 `item.image` 是否為真值決定 `"loading"` 或 `"missing"`。`item.image` 是純資料 prop，server / client 一致 → 初始 state 一致。
- Hydration：client 第一次 render 結果與 SSR 完全相同（都顯示 fallback）。
- Mount 後：useEffect 才開始預載並可能切到 `"ready"`。React 視為 client-side update，不算 mismatch。

實測 dev log 無 hydration warning。

### 為何不會在切換單字時看到舊圖

父層 `VocabularyReview.tsx` 用 `<VocabularyCard key={current.id} item={current} />`，切換單字時 `key` 變化 → 整個 component remount → `useState` 初始化函式重新跑（拿新 `item.image`）→ `imageStatus` 回到 `"loading"`，等預載結果。沒有舊 state 殘留。

### 為何「載入中」與「缺檔」共用同一個 fallback 視覺

兩種情境都顯示「色塊 + 首字母 + 圖片準備中」。原因：

1. **避免閃爍**：如果載入中顯示一種視覺、缺檔顯示另一種，使用者切到下一張時會在兩種 placeholder 間跳動。
2. **小一友善**：對小一而言「圖片正在來」與「圖片不在」的差別並不重要，重點是不要看到 broken icon。
3. **視覺一致**：dev 環境下圖片仍是 404，讓 loading 與 missing 共用樣式可確保 dev / 未來 prod 兩端一致。

當素材就位後，預載成功才會切到真圖；過渡通常 < 100ms，使用者幾乎察覺不到。

### 移除的東西

- `imageBroken` state 與 `setImageBroken` setter 全部刪除。
- `<img>` 上的 `onError={() => setImageBroken(true)}` 屬性移除（不再需要，因為只有 `imageStatus === "ready"` 才會渲染 `<img>`）。
- `// eslint-disable-next-line @next/next/no-img-element` 保留——本輪維持 `<img>`（任務單明示不重構）。

## 【新增了哪些能力】

- 第一次開啟 `/review` 時，缺圖卡片**第一幀**就顯示 fallback，不再經歷「broken icon → fallback」的閃爍。
- 圖片 fallback 對「來不及掛 onError」「圖片真的 404」「沒有 image 欄位」三種情境提供一致行為。
- SSR HTML 不再洩露未必存在的圖片路徑，網路 panel 上不再有針對 `/images/*.png` 的隱性 404 預載（瀏覽器只會在 client 端 `probe.src` 賦值後才去嘗試）。

## 【新增/調整測試】

無。任務單明確未指派測試框架。本輪以人工 smoke test 為驗收手段。

## 【測試結果】

自動驗收：

- `npm run lint` → **通過**（0 警告 0 錯誤）。
- `npm run typecheck` → **通過**（exit 0）。
- `npm run build` → **通過**：

  ```
  ▲ Next.js 16.2.5 (Turbopack)
  ✓ Compiled successfully in 897ms
  ✓ Generating static pages using 7 workers (6/6) in 160ms
  Route (app)
  ┌ ○ / ├ ○ /_not-found ├ ○ /quiz └ ○ /review
  ○ (Static) prerendered as static content
  ```

人工 smoke test（`npm run dev` + curl）：

| 路徑 | 狀態 |
| --- | --- |
| `/` | 200，標題「Cambridge Starters Practice」未變動 |
| `/review` | 200，含「📚 單字複習」「🍎 食物」「🐶 動物」「🎨 顏色」「🔢 數字」「apple」「發音」 |
| `/quiz` | 200，標題「測驗區 · Cambridge Starters Practice」未變動 |

**關鍵驗證**：

```
$ grep -oE '<img[^>]*src="/images/[^"]*"[^>]*>' /tmp/csp-p2fix-review.html
(no broken <img> in SSR HTML — fallback active)

$ grep -c '圖片準備中' /tmp/csp-p2fix-review.html
1

$ grep -oE '>A<' /tmp/csp-p2fix-review.html | head -3
>A<
```

SSR HTML 已**不**含 `<img src="/images/...">`，已含「圖片準備中」一次（apple 卡片），已含首字母 `A`。修補確認生效。

dev log 無 hydration warning、無 React error、無 audio 相關錯誤；切換 / 與 /quiz 也無連動破壞。

## 【仍未處理】

- 真實圖片與音檔素材（P2-2，本輪刻意不動）。
- 「翻牌」式互動（P2-2）。
- 補齊更多分類的範例單字（P2-2）。
- P1 兩條可選 housekeeping（`.editorconfig`、GitHub repo / 遠端）。
- `npm audit` 兩個 moderate 警告（任務單禁止處理）。

## 【後續建議】

1. **請 Codex 用「驗收 9 段」做一次 P2-1 收尾驗收**，重點：
   - 開瀏覽器確認第一張 apple 卡片**不再看到 broken image icon**（之前 Codex 卡點）。
   - 在 Network panel 確認 `/images/apple.png` 仍會被請求（`probe.src` 觸發），但**不影響畫面**。
   - 確認音檔 fallback 仍依先前驗收結果正常運作（本輪未動該段邏輯）。
2. **長期方向（等真實素材就位後）**：可改回 `next/image` 並把預載責任交還給 Next.js image optimization。本輪維持 `<img>` 是因為素材未齊；改回的時機建議是「至少有 5 個分類的真圖」。
3. **P2-2 任務單建議優先序（請 ChatGPT 收斂）**：補齊各分類的範例單字 → 翻牌互動 → 真實圖片（建議先用自繪 256×256 PNG 或簡單 placeholder 服務）→ 真實音檔（建議用 TTS 自製，避開官方版權）。
4. **可選優化**（**本輪未做**，仅列入建議）：若素材路徑已知必定缺檔，未來可在 `lib/data.ts` 加一個 `imageAvailable` 旗標統一管理，避免每次都讓 `probe` 跑一次 404 請求。但目前單字數量很少，無顯著效益，待 P2-2 補真實素材時再評估。

## 【Roadmap 同步檢查】

本輪屬「P2-1 收尾修補」，**不涉及 Roadmap 條目翻牌**。對照 `PROJECT_ROADMAP.md`：

- P2-1 五條（`/review` 串接、分類切換、單字卡 UI、圖片 fallback、發音 fallback）目前狀態維持 ✅，本輪是讓「圖片 fallback」這條從「程式存在但首載未生效」收斂成「程式存在且首載即生效」，狀態本質不變。
- P2 階段標題維持 🟡（仍有 P2-2 待做）。
- P1 / P3 / P4 / P5 皆未動。

如 Codex 本次驗收結論為「驗收通過」，建議由 ChatGPT 在下一輪指派 Claude Code 開始 P2-2（補範例單字 → 翻牌互動）。
