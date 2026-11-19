import { forwardRef, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

const control =
  "w-full h-10 rounded-xl border border-border bg-surface px-3 text-sm text-fg placeholder:text-subtle shadow-sm transition focus:outline-none focus:border-accent focus:ring-4 focus:ring-[var(--ring)] disabled:opacity-60 aria-[invalid=true]:border-danger";

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(function Input({ className, ...p }, ref) {
  return <input ref={ref} className={cn(control, className)} {...p} />;
});

export const Select = forwardRef<HTMLSelectElement, SelectHTMLAttributes<HTMLSelectElement>>(function Select({ className, ...p }, ref) {
  return <select ref={ref} className={cn(control, "pr-8", className)} {...p} />;
});

export function Field({ label, htmlFor, hint, error, children }: { label: string; htmlFor: string; hint?: ReactNode; error?: string; children: ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={htmlFor} className="block text-[13px] font-medium text-fg">{label}</label>
      {children}
      {error ? <p className="text-[12px] text-danger" role="alert">{error}</p> : hint ? <p className="text-[12px] text-muted">{hint}</p> : null}
    </div>
  );
}

export function FormMessage({ state }: { state?: { error?: string; success?: string } | null }) {
  if (!state?.error && !state?.success) return null;
  return (
    <div role={state.error ? "alert" : "status"} className={cn("rounded-xl px-3 py-2 text-[13px]", state.error ? "bg-danger-soft text-danger" : "bg-success-soft text-success")}>
      {state.error ?? state.success}
    </div>
  );
}
