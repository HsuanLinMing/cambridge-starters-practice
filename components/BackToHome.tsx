import Link from "next/link";

export default function BackToHome() {
  return (
    <Link
      href="/"
      className="inline-flex items-center text-sm text-slate-500 hover:text-slate-800"
    >
      <span className="mr-1">←</span> 回首頁
    </Link>
  );
}
