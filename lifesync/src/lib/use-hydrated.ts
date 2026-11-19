"use client";

import { useEffect, useState } from "react";

/**
 * True once the component has hydrated. Used to keep submit buttons disabled
 * until React owns the form, so a click during streaming/hydration can't fall
 * back to a native POST whose result (e.g. a one-time invite link) is never shown.
 */
export function useHydrated(): boolean {
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => setHydrated(true), []);
  return hydrated;
}
