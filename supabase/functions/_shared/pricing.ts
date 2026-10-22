/** Shared FSG pricing + numbering (dependency-free, unit-testable). */

export const OZ = 31.1035;
export const USD_MYR = 4.7;

export interface MineralPrice {
  id: string;
  base: "oz" | "kg" | "t";
  price: number;
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

export function perGramUSD(m: MineralPrice): number {
  return m.base === "oz" ? m.price / OZ : m.base === "kg" ? m.price / 1000 : m.price / 1e6;
}

export function formatQuoteNumber(seq: number, now = new Date()): string {
  return `FSG-Q-${now.getFullYear()}-${String(seq).padStart(6, "0")}`;
}

export function formatInvoiceNumber(seq: number, now = new Date()): string {
  return `FSG-INV-${now.getFullYear()}-${String(seq).padStart(6, "0")}`;
}

export function fmtMYR(n: number): string {
  return `RM ${n.toLocaleString("en-MY", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}
