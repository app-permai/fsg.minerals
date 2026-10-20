import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { formatQuoteNumber, parseQuoteBody, priceQuote } from "./core.ts";

describe("parseQuoteBody", () => {
  it("accepts a valid request", () => {
    const r = parseQuoteBody({ name: "Ali", email: "ali@co.com", mineral: "copper", quantity: 100, unit: "g" });
    assert.equal(r.ok, true);
  });
  it("rejects bad email", () => {
    const r = parseQuoteBody({ name: "Ali", email: "bukan-email", mineral: "COPPER", quantity: 1 });
    assert.equal(r.ok, false);
  });
  it("rejects unknown mineral", () => {
    const r = parseQuoteBody({ name: "Ali", email: "a@b.co", mineral: "VIBRANIUM", quantity: 1 });
    assert.equal(r.ok, false);
  });
  it("rejects non-positive quantity", () => {
    const r = parseQuoteBody({ name: "Ali", email: "a@b.co", mineral: "AURUM", quantity: 0 });
    assert.equal(r.ok, false);
  });
});

describe("priceQuote", () => {
  it("prices 100g copper at reference rate", () => {
    const parsed = parseQuoteBody({ name: "A", email: "a@b.co", mineral: "COPPER", quantity: 100, unit: "g" });
    assert.equal(parsed.ok, true);
    if (!parsed.ok) return;
    const p = priceQuote(parsed.value);
    // 9520 USD/t, 4.70 rate => 0.044744 MYR/g => RM4.4744 for 100g
    assert.ok(Math.abs(p.grossMyr - 4.4744) < 1e-6);
  });
});

describe("formatQuoteNumber", () => {
  it("pads the sequence", () => {
    assert.equal(formatQuoteNumber(7, new Date("2026-01-02")), "FSG-Q-2026-000007");
  });
});
