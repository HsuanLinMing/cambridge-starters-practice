import BackToHome from "@/components/BackToHome";
import VocabularyReview from "@/components/VocabularyReview";
import { vocabulary } from "@/lib/data";

export const metadata = {
  title: "單字複習 · Cambridge Starters Practice",
};

export default function ReviewPage() {
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col px-4 py-8 sm:px-6 sm:py-10">
      <BackToHome />
      <header className="mt-4 text-center">
        <h1 className="text-3xl font-black text-slate-900 sm:text-4xl">
          📚 單字複習
        </h1>
        <p className="mt-2 text-base text-slate-600 sm:text-lg">
          選一個分類，看看單字！
        </p>
      </header>

      <section className="mt-8">
        <VocabularyReview vocabulary={vocabulary} />
      </section>
    </main>
  );
}
