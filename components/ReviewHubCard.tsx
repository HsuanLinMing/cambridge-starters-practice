import Link from "next/link";

type ReviewHubCardProps = {
  href?: string;
  title: string;
  description: string;
  emoji: string;
  /** ready 為可點卡片；coming-soon 為淡化、不可點。預設 ready。 */
  status?: "ready" | "coming-soon";
};

export default function ReviewHubCard({
  href,
  title,
  description,
  emoji,
  status = "ready",
}: ReviewHubCardProps) {
  if (status === "coming-soon" || !href) {
    return (
      <div
        aria-disabled="true"
        aria-label={`${title}，準備中`}
        className="block rounded-3xl border border-dashed border-slate-200 bg-white/60 p-6 shadow-sm"
      >
        <div className="flex items-start justify-between gap-3">
          <span className="text-4xl" aria-hidden>
            {emoji}
          </span>
          <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-700">
            準備中
          </span>
        </div>
        <h2 className="mt-4 text-xl font-bold text-slate-500">{title}</h2>
        <p className="mt-2 text-sm leading-relaxed text-slate-400">
          {description}
        </p>
      </div>
    );
  }

  return (
    <Link
      href={href}
      className="group block rounded-3xl border border-amber-100 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:border-amber-300 hover:shadow-md focus:outline-none focus-visible:ring-4 focus-visible:ring-amber-200"
    >
      <div className="text-4xl" aria-hidden>
        {emoji}
      </div>
      <h2 className="mt-4 text-xl font-bold text-slate-900">{title}</h2>
      <p className="mt-2 text-sm leading-relaxed text-slate-600">
        {description}
      </p>
      <div className="mt-6 inline-flex items-center text-sm font-bold text-slate-700 group-hover:text-slate-900">
        進入
        <span className="ml-1 transition group-hover:translate-x-0.5">→</span>
      </div>
    </Link>
  );
}
