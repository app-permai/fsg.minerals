import { createClient } from "npm:@supabase/supabase-js@2.57.4";
import { MINERALS, USD_MYR, formatInvoiceNumber } from "../_shared/pricing.ts";
import { buildDocPdf } from "../_shared/pdf.ts";

/**
 * FSG admin-api — staff-only backend for the quotation/invoicing system.
 *
 * Auth: request header `x-admin-token` must equal the ADMIN_TOKEN secret.
 * (No Supabase Auth needed; token lives in function secrets + staff browser.)
 *
 * POST { action, ...params } — actions:
 *   overview | quotes.list | quotes.set-status | quotes.convert |
 *   invoices.list | invoices.paid | invoices.void | docs.url
 *
 * Secrets: ADMIN_TOKEN (required), SALES_EMAIL (optional note field only).
 */

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey, X-Admin-Token",
};

function json(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

type QuoteRow = {
  number: string;
  name: string;
  email: string;
  company: string | null;
  mineral: string;
  quantity: number;
  unit: string;
  unit_price_usd: number | null;
  amount_myr: number | null;
  message: string | null;
  email_status: string;
  created_at: string;
};

function docLines(q: {
  mineral: string;
  quantity: number;
  unit: string;
  unit_price_usd: number | null;
}): { label: string; value: string }[] {
  const base = MINERALS.find((m) => m.id === q.mineral)?.base ?? "-";
  return [
    { label: "Mineral", value: q.mineral },
    { label: "Kuantiti", value: `${q.quantity} ${q.unit}` },
    {
      label: "Harga unit (rujukan)",
      value: q.unit_price_usd != null ? `USD ${q.unit_price_usd} / ${base}` : "-",
    },
    { label: "Kadar USD-MYR (rujukan)", value: String(USD_MYR) },
  ];
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { status: 200, headers: corsHeaders });
  if (req.method !== "POST") return json(405, { error: "Method not allowed" });

  const adminToken = Deno.env.get("ADMIN_TOKEN") ?? "";
  if (!adminToken) return json(500, { error: "Server tidak dikonfigurasi" });
  if (req.headers.get("x-admin-token") !== adminToken) return json(401, { error: "Tidak dibenarkan" });

  const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
  if (!supabaseUrl || !serviceRoleKey) return json(500, { error: "Server tidak dikonfigurasi" });

  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return json(400, { error: "JSON tidak sah" });
  }
  const action = typeof body.action === "string" ? body.action : "";

  const db = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  if (action === "overview") {
    const { data: quotes } = await db.from("fsg_quotes").select("number,mineral,amount_myr,status,email_status,created_at").order("created_at", { ascending: false }).limit(10);
    const { data: invoices } = await db.from("fsg_invoices").select("number,amount_myr,status,created_at").order("created_at", { ascending: false }).limit(10);
    const { data: qAll } = await db.from("fsg_quotes").select("amount_myr");
    const { data: iAll } = await db.from("fsg_invoices").select("amount_myr,status");
    const sum = (rows: { amount_myr: number | null }[] | null) =>
      (rows ?? []).reduce((t, r) => t + (Number(r.amount_myr) || 0), 0);
    return json(200, {
      ok: true,
      quotes_count: (qAll ?? []).length,
      quotes_total_myr: Math.round(sum(qAll) * 100) / 100,
      invoices_issued_myr: Math.round(sum((iAll ?? []).filter((r) => (r as { status: string }).status !== "void")) * 100) / 100,
      invoices_paid_myr: Math.round(sum((iAll ?? []).filter((r) => (r as { status: string }).status === "paid")) * 100) / 100,
      recent_quotes: quotes ?? [],
      recent_invoices: invoices ?? [],
    });
  }

  if (action === "quotes.list") {
    const status = typeof body.status === "string" && body.status !== "all" ? body.status : null;
    let query = db.from("fsg_quotes").select("*").order("created_at", { ascending: false }).limit(200);
    if (status) query = query.eq("status", status);
    const { data, error } = await query;
    if (error) return json(500, { error: "Gagal membaca sebutharga" });
    return json(200, { ok: true, rows: data });
  }

  if (action === "quotes.set-status") {
    const number = typeof body.number === "string" ? body.number : "";
    const status = typeof body.status === "string" ? body.status : "";
    if (!["pending", "confirmed", "cancelled"].includes(status)) {
      return json(400, { error: "Status tidak sah" });
    }
    const { error } = await db.from("fsg_quotes").update({ status }).eq("number", number);
    if (error) return json(500, { error: "Gagal mengemas kini" });
    return json(200, { ok: true });
  }

  if (action === "quotes.convert") {
    const number = typeof body.number === "string" ? body.number : "";
    const { data: quote, error: qErr } = await db.from("fsg_quotes").select("*").eq("number", number).maybeSingle();
    if (qErr || !quote) return json(404, { error: "Sebutharga tidak dijumpai" });
    const q = quote as QuoteRow & { status: string };
    if (q.status === "invoiced") return json(400, { error: "Sebutharga ini sudah diinvois" });

    const { data: seq, error: seqErr } = await db.rpc("fsg_invoice_nextval");
    if (seqErr || typeof seq !== "number") return json(500, { error: "Gagal menjana nombor invois" });
    const invNumber = formatInvoiceNumber(seq);
    const amount = Math.round(Number(q.amount_myr || 0) * 100) / 100;

    const { error: insErr } = await db.from("fsg_invoices").insert({
      number: invNumber,
      quote_number: q.number,
      name: q.name,
      email: q.email,
      company: q.company,
      mineral: q.mineral,
      quantity: q.quantity,
      unit: q.unit,
      unit_price_usd: q.unit_price_usd,
      amount_myr: amount,
      status: "issued",
      pdf_path: `invoices/${invNumber}.pdf`,
    });
    if (insErr) return json(500, { error: "Gagal mencipta invois" });

    const dateISO = new Date().toISOString().slice(0, 10);
    const shared = {
      billName: q.name,
      billEmail: q.email,
      billCompany: q.company,
      lines: docLines(q),
      totalMyr: amount,
      dateISO,
    };
    const invPdf = await buildDocPdf({
      kind: "INVOIS",
      number: invNumber,
      refNumber: q.number,
      ...shared,
      footerNote:
        "Invois FSG — sila jelaskan dalam 14 hari. Sebarang pertanyaan hubungi info@fsgminerals.trade. FIRST STRATEGIC GLOBAL SDN. BHD. 202601003838 (1665935-K).",
    });
    const qPdf = await buildDocPdf({
      kind: "SEBUTHARGA",
      number: q.number,
      refNumber: null,
      ...shared,
      footerNote:
        "Sebutharga rujukan automatik, sah 14 hari dari tarikh. Harga tertakluk pengesahan akhir FSG. Bukan invois cukai.",
    });
    const storage = db.storage.from("fsg-docs");
    const up1 = await storage.upload(`invoices/${invNumber}.pdf`, invPdf, { contentType: "application/pdf", upsert: true });
    if (up1.error) return json(500, { error: "Gagal menyimpan PDF invois" });
    await storage.upload(`quotes/${q.number}.pdf`, qPdf, { contentType: "application/pdf", upsert: true });
    await db.from("fsg_quotes").update({ status: "invoiced" }).eq("number", q.number);

    const invUrl = (await storage.createSignedUrl(`invoices/${invNumber}.pdf`, 3600)).data?.signedUrl ?? null;
    const qUrl = (await storage.createSignedUrl(`quotes/${q.number}.pdf`, 3600)).data?.signedUrl ?? null;
    return json(200, { ok: true, invoice: invNumber, amount_myr: amount, invoice_url: invUrl, quote_url: qUrl });
  }

  if (action === "invoices.list") {
    const { data, error } = await db.from("fsg_invoices").select("*").order("created_at", { ascending: false }).limit(200);
    if (error) return json(500, { error: "Gagal membaca invois" });
    return json(200, { ok: true, rows: data });
  }

  if (action === "invoices.paid" || action === "invoices.void") {
    const number = typeof body.number === "string" ? body.number : "";
    const patch = action === "invoices.paid"
      ? { status: "paid", paid_at: new Date().toISOString() }
      : { status: "void" };
    const { error } = await db.from("fsg_invoices").update(patch).eq("number", number);
    if (error) return json(500, { error: "Gagal mengemas kini invois" });
    return json(200, { ok: true });
  }

  if (action === "docs.url") {
    const path = typeof body.path === "string" ? body.path : "";
    if (!path.startsWith("invoices/") && !path.startsWith("quotes/")) return json(400, { error: "Path tidak sah" });
    const { data, error } = await db.storage.from("fsg-docs").createSignedUrl(path, 3600);
    if (error || !data) return json(404, { error: "Dokumen tidak dijumpai" });
    return json(200, { ok: true, url: data.signedUrl });
  }

  return json(400, { error: "Action tidak dikenali" });
});
