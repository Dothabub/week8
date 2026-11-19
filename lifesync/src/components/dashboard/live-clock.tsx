"use client";

import { useEffect, useState } from "react";
import { fmtLongDate } from "@/lib/format";

/** Live date + time in the household timezone. Server renders the initial value. */
export function LiveClock({ tz, initialIso }: { tz: string; initialIso: string }) {
  const [now, setNow] = useState(() => new Date(initialIso));
  useEffect(() => {
    setNow(new Date());
    const id = setInterval(() => setNow(new Date()), 15_000);
    return () => clearInterval(id);
  }, []);
  const time = new Intl.DateTimeFormat("en-GB", { timeZone: tz, hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).format(now);
  return (
    <div className="text-right">
      <div className="tabular text-3xl font-semibold tracking-tight text-fg sm:text-4xl" aria-live="off">
        <time dateTime={now.toISOString()}>{time}</time>
      </div>
      <div className="mt-0.5 text-[13px] text-muted">{fmtLongDate(now, tz)}</div>
    </div>
  );
}
