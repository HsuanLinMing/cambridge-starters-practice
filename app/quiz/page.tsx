import BackToHome from "@/components/BackToHome";
import QuizPlay from "@/components/QuizPlay";
import { p3ExamplePapers, p3ExampleQuestions } from "@/lib/data";
import type { ExamQuestion, QuestionType } from "@/lib/types";

export const metadata = {
  title: "測驗區 · Cambridge Starters Practice",
};

/**
 * Reading & Writing 段內題型順序（從易到難 / 從圖到字）：
 * picture-choice → true-false → word-choice → spelling → multiple-choice → fill-blank → matching
 */
const RW_TYPE_ORDER: Record<QuestionType, number> = {
  // listening-choice 不在 R&W 段，給一個任意值即可
  "listening-choice": 0,
  "picture-choice": 1,
  "true-false": 2, // P3-9-C 第三刀新增：RW1 yes / no 判斷題（與 picture-choice 同 RW1，先做 4 選 1 後做 yes / no）
  "word-choice": 3,
  spelling: 4, // P3-9-C 第三刀後續新增：RW3 看圖拼字（接在 word-choice / 看字選圖之後，從認字到拼字）
  "multiple-choice": 5,
  "fill-blank": 6,
  matching: 7,
};

/**
 * 把題目分兩段排序，貼近正式 Cambridge Starters 結構：
 *
 *   Section 1：Listening（listening-choice）
 *   Section 2：Reading & Writing（picture-choice → true-false → word-choice → spelling → multiple-choice → fill-blank → matching）
 *
 * 段內 stable sort（同題型維持原始順序）；不修改 JSON 來源。
 */
function sortQuestionsForStarters(questions: ExamQuestion[]): ExamQuestion[] {
  const listening = questions.filter((q) => q.type === "listening-choice");
  const readingWriting = [...questions]
    .filter((q) => q.type !== "listening-choice")
    .sort((a, b) => RW_TYPE_ORDER[a.type] - RW_TYPE_ORDER[b.type]);
  return [...listening, ...readingWriting];
}

export default function QuizPage() {
  // 取第一份範例考卷
  const paper = p3ExamplePapers[0];

  // 把所有 sections 的 questionIds 平鋪成單一順序
  const questionOrder = paper
    ? paper.sections.flatMap((s) => s.questionIds)
    : [];

  // 對應 id → ExamQuestion
  const questionsById = new Map(
    p3ExampleQuestions.map((q) => [q.id, q] as const),
  );
  const flatQuestions: ExamQuestion[] = questionOrder
    .map((id) => questionsById.get(id))
    .filter((q): q is ExamQuestion => q !== undefined);

  // 依正式 Starters 結構重新排序：Listening → Reading & Writing
  const questions = sortQuestionsForStarters(flatQuestions);

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col px-4 py-8 sm:px-6 sm:py-10">
      <BackToHome />

      <header className="mt-4 text-center">
        <h1 className="text-3xl font-black text-slate-900 sm:text-4xl">
          📝 測驗區
        </h1>
        {paper && (
          <p className="mt-2 text-base text-slate-600 sm:text-lg">
            {paper.title}
          </p>
        )}
        <p className="mt-1 text-xs text-slate-400">
          P3-6-A 最小可玩第一版（範例資料）｜順序：Listening → Reading &amp; Writing
        </p>
        <p className="mt-1 text-xs text-slate-400">
          目前為練習版，題型逐步對齊正式 Cambridge Starters
        </p>
      </header>

      <section className="mt-8">
        {paper && questions.length > 0 ? (
          <QuizPlay paperId={paper.examPaperId} questions={questions} />
        ) : (
          <div className="rounded-3xl bg-white p-8 text-center text-slate-500 shadow-sm">
            目前沒有題目，請稍後再來。
          </div>
        )}
      </section>
    </main>
  );
}
