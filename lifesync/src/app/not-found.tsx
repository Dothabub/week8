import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-2 bg-bg px-4 text-center">
      <p className="text-sm font-medium text-subtle">404</p>
      <h1 className="text-xl font-semibold">Page not found</h1>
      <Link href="/dashboard" className="mt-3 text-[13px] font-medium text-accent hover:underline">Back to dashboard</Link>
    </div>
  );
}
