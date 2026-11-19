import { Prisma } from "@prisma/client";

/**
 * Money arithmetic in integer minor units (pence) to avoid floating-point error.
 * Values cross the DB boundary as Prisma.Decimal.
 */
export type Pence = number;

export function toPence(value: Prisma.Decimal | string | number): Pence {
  const d = new Prisma.Decimal(value);
  return d.mul(100).toDecimalPlaces(0, Prisma.Decimal.ROUND_HALF_UP).toNumber();
}

export function fromPence(p: Pence): Prisma.Decimal {
  return new Prisma.Decimal(p).div(100);
}

/** quantity × unitPrice rounded half-up to the penny (e.g. 5 kg × £2.00 = £10.00). */
export function lineTotal(quantity: Prisma.Decimal | string | number, unitPrice: Prisma.Decimal | string | number): Prisma.Decimal {
  return new Prisma.Decimal(quantity).mul(unitPrice).toDecimalPlaces(2, Prisma.Decimal.ROUND_HALF_UP);
}

export function formatMoney(value: Prisma.Decimal | string | number, currency = "GBP", locale = "en-GB"): string {
  return new Intl.NumberFormat(locale, { style: "currency", currency }).format(new Prisma.Decimal(value).toNumber());
}

export type SplitInput =
  | { method: "EQUAL"; participants: string[] }
  | { method: "SINGLE_PAYER"; payerId: string }
  | { method: "CUSTOM_AMOUNT"; amounts: Record<string, Pence> }
  | { method: "PERCENTAGE"; percentages: Record<string, number> };

export class SplitError extends Error {}

/**
 * Splits a total (in pence) into per-person shares that always sum exactly to the
 * total. Remainder pennies are distributed deterministically (sorted user id order),
 * so nobody is silently over- or under-charged.
 */
export function splitAmount(totalPence: Pence, split: SplitInput): Record<string, Pence> {
  if (!Number.isInteger(totalPence) || totalPence < 0) throw new SplitError("Total must be a non-negative whole number of pence");
  switch (split.method) {
    case "SINGLE_PAYER":
      return { [split.payerId]: totalPence };
    case "EQUAL": {
      const ids = [...new Set(split.participants)].sort();
      if (ids.length === 0) throw new SplitError("At least one participant is required");
      const base = Math.floor(totalPence / ids.length);
      let rem = totalPence - base * ids.length;
      return Object.fromEntries(ids.map((id) => [id, base + (rem-- > 0 ? 1 : 0)]));
    }
    case "CUSTOM_AMOUNT": {
      const entries = Object.entries(split.amounts);
      if (entries.length === 0) throw new SplitError("At least one participant is required");
      if (entries.some(([, v]) => !Number.isInteger(v) || v < 0)) throw new SplitError("Amounts must be non-negative pence");
      const sum = entries.reduce((s, [, v]) => s + v, 0);
      if (sum !== totalPence) throw new SplitError(`Custom amounts (${sum}) must equal the total (${totalPence})`);
      return Object.fromEntries(entries);
    }
    case "PERCENTAGE": {
      const entries = Object.entries(split.percentages).sort(([a], [b]) => a.localeCompare(b));
      if (entries.length === 0) throw new SplitError("At least one participant is required");
      if (entries.some(([, p]) => !(p >= 0 && p <= 100))) throw new SplitError("Percentages must be between 0 and 100");
      const pctSum = entries.reduce((s, [, p]) => s + p, 0);
      if (Math.abs(pctSum - 100) > 1e-9) throw new SplitError(`Percentages must total 100 (got ${pctSum})`);
      // Largest-remainder method.
      const raw = entries.map(([id, p]) => ({ id, exact: (totalPence * p) / 100 }));
      const out = raw.map((r) => ({ id: r.id, v: Math.floor(r.exact), frac: r.exact - Math.floor(r.exact) }));
      let rem = totalPence - out.reduce((s, r) => s + r.v, 0);
      [...out].sort((a, b) => b.frac - a.frac || a.id.localeCompare(b.id)).forEach((r) => {
        if (rem > 0) { r.v += 1; rem -= 1; }
      });
      return Object.fromEntries(out.map((r) => [r.id, r.v]));
    }
  }
}
