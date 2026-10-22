/**
 * FSG create-quote — pure, dependency-free core logic.
 *
 * Validates public quotation requests, prices the 9 FSG minerals from the
 * reference list (USD base units, same as the Market Tool), and formats the
 * quotation number. No I/O here so it can be unit-tested with node --test.
 */

export const OZ = 31.1035;
export const USD_MYR = 4.7;

export interface MineralPrice {
  id: string;
  base: "oz" | "kg" | "t";
  price: number; // USD per base unit
}

export const MINERALS: MineralPrice[] = [
  { id: "COPPER", base: "t", price: 9520 },
  { id: "TITA", base: "t", price: 11500 },
  { id: "LITH", base: "t", price: 10800 },
  { id: "COLTAN", base: "kg", price: 85 },
  { id: "TANT", base: "kg", price: 185 },
  { id: "AURUM", base: "oz", price: 2675 },
  { id: "SILVER", base: "oz", price: 31.8 },
  { id: "TIN", base: "t", price: 32200 },
  { id: "ALU", base: "t", price: 2620 },
];

export type Unit = "g" | "kg" | "oz" | "t";

export interface QuoteInput {
  name: unknown;
  email: unknown;
  company?: unknown;
  mineral: unknown;
  quantity: unknown;
  unit?: unknown;
  message?: unknown;
}

export interface ValidQuote {
  name: string;
  email: string;
  company: string | null;
  mineral: MineralPrice;
  quantity: number;
  unit: Unit;
  message: string | null;
}

export type ParseResult = { ok: true; value: ValidQuote } | { ok: false; error: string };

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

function str(v: unknown, max: number): string | null {
  if (typeof v !== "string") return null;
  const s = v.trim();
  if (!s || s.length > max) return null;
  return s;
}

export function parseQuoteBody(raw: unknown): ParseResult {
  const b = (raw ?? {}) as Record<string, unknown>;
  const name = str(b.name, 120);
  if (!name) return { ok: false, error: "Nama diperlukan (maks 120 aksara)." };
  const email = str(b.email, 160);
  if (!email || !EMAIL_RE.test(email)) return { ok: false, error: "Email tidak sah." };
  const mineralId = typeof b.mineral === "string" ? b.mineral.trim().toUpperCase() : "";
  const mineral = MINERALS.find((m) => m.id === mineralId);
  if (!mineral) return { ok: false, error: "Mineral tidak dikenali." };
  const quantity = typeof b.quantity === "number" ? b.quantity : Number(b.quantity);
  if (!Number.isFinite(quantity) || quantity <= 0 || quantity > 1e9) {
    return { ok: false, error: "Kuantiti tidak sah." };
  }
  const unitRaw = typeof b.unit === "string" ? b.unit.trim().toLowerCase() : "g";
  const unit: Unit = unitRaw === "kg" || unitRaw === "oz" || unitRaw === "t" ? (unitRaw as Unit) : "g";
  const companyRaw = b.company == null || b.company === "" ? null : str(b.company, 160);
  if (b.company != null && b.company !== "" && companyRaw == null) {
    return { ok: false, error: "Nama syarikat terlalu panjang." };
  }
  const messageRaw = b.message == null || b.message === "" ? null : str(b.message, 2000);
  if (b.message != null && b.message !== "" && messageRaw == null) {
    return { ok: false, error: "Mesej terlalu panjang (maks 2000 aksara)." };
  }
  return { ok: true, value: { name, email, company: companyRaw, mineral, quantity, unit, message: messageRaw } };
}

function perGramUSD(m: MineralPrice): number {
  return m.base === "oz" ? m.price / OZ : m.base === "kg" ? m.price / 1000 : m.price / 1e6;
}

export function toGrams(quantity: number, unit: Unit): number {
  return unit === "g" ? quantity : unit === "kg" ? quantity * 1000 : unit === "oz" ? quantity * OZ : quantity * 1e6;
}

/** Reference totals (not an official FSG quotation until confirmed). */
export function priceQuote(v: ValidQuote): { grams: number; perGramMyr: number; grossMyr: number } {
  const grams = toGrams(v.quantity, v.unit);
  const perGramMyr = perGramUSD(v.mineral) * USD_MYR;
  return { grams, perGramMyr, grossMyr: grams * perGramMyr };
}

export function formatQuoteNumber(seq: number, now = new Date()): string {
  return `FSG-Q-${now.getFullYear()}-${String(seq).padStart(6, "0")}`;
}
