import Link from "next/link";

type EntryCardProps = {
  href: string;
  title: string;
  description: string;
  emoji: string;
};

export default function EntryCard({
  href,
  title,
  description,
  emoji,
}: EntryCardProps) {
  return (
    <Link
      href={href}
      className="group block rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:border-slate-300 hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
    >
      <div className="text-3xl">{emoji}</div>
      <h2 className="mt-4 text-xl font-semibold text-slate-900">{title}</h2>
      <p className="mt-2 text-sm leading-relaxed text-slate-600">
        {description}
      </p>
      <div className="mt-6 inline-flex items-center text-sm font-medium text-slate-700 group-hover:text-slate-900">
        進入
        <span className="ml-1 transition group-hover:translate-x-0.5">→</span>
      </div>
    </Link>
  );
}
