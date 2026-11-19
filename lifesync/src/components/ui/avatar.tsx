import { cn } from "@/lib/cn";

const palette = ["#4f46e5", "#0d9488", "#db2777", "#ea580c", "#2563eb", "#7c3aed"];

export function initials(name: string) {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map((p) => p[0]!.toUpperCase()).join("") || "?";
}

export function Avatar({ name, userId, hasImage, size = 32, version, className }: { name: string; userId: string; hasImage?: boolean; size?: number; version?: string | number; className?: string }) {
  const color = palette[[...userId].reduce((s, c) => s + c.charCodeAt(0), 0) % palette.length];
  return (
    <span
      className={cn("inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full font-semibold text-white ring-2 ring-surface", className)}
      style={{ width: size, height: size, background: color, fontSize: size * 0.38 }}
      aria-label={name}
    >
      {hasImage ? (
        // eslint-disable-next-line @next/next/no-img-element -- authenticated same-origin endpoint
        <img src={`/api/avatar/${userId}${version ? `?v=${version}` : ""}`} alt="" width={size} height={size} className="h-full w-full object-cover" />
      ) : (
        initials(name)
      )}
    </span>
  );
}
