import { createClient } from "npm:@supabase/supabase-js@2.57.4";
import { formatQuoteNumber, parseQuoteBody, priceQuote, USD_MYR } from "./core.ts";

/**
 * FSG create-quote — public quotation endpoint.
 *
 * POST { name, email, company?, mineral, quantity, unit?, message? }
 * -> validates, prices from the reference list, stores the row in
 *    public.fsg_quotes (service_role only, RLS locked down), and
 *    best-effort emails the quotation PDF link/details to the client
 *    plus info@ via SMTP.
 *
 * Secrets (supabase secrets set --project-ref wjrlcbhmklodrtpuhprq):
 * - RESEND_API_KEY  (Resend API key, disyorkan — paling mudah)
 * - RESEND_FROM     (optional, default info@fsgminerals.trade; mesti domain
 *                    yang disahkan di Resend, kecuali untuk ujian ke email sendiri)
 * - ZOHO_SMTP_USER / ZOHO_SMTP_PASS  (alternatif: SMTP Zoho Mail)
 * - SALES_EMAIL                       (default info@fsgminerals.trade)
 * Tanpa kredensial emel, sebutharga tetap disimpan + bernombor;
 * respons melaporkan email_status "skipped".
 */

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

function json(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { status: 200, headers: corsHeaders });
  if (req.method !== "POST") return json(405, { error: "Method not allowed" });

  const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
  if (!supabaseUrl || !serviceRoleKey) return json(500, { error: "Server tidak dikonfigurasi" });

  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return json(400, { error: "JSON tidak sah" });
  }
  const parsed = parseQuoteBody(raw);
  if (!parsed.ok) return json(400, { error: parsed.error });
  const q = parsed.value;
  const totals = priceQuote(q);

  const service = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { data: seqData, error: seqError } = await service.rpc("fsg_quote_nextval");
  if (seqError || typeof seqData !== "number") {
    console.error("create-quote seq failed", { message: seqError?.message });
    return json(500, { error: "Gagal menjana nombor sebutharga" });
  }
  const number = formatQuoteNumber(seqData);

  const { error: insertError } = await service.from("fsg_quotes").insert({
    number,
    name: q.name,
    email: q.email,
    company: q.company,
    mineral: q.mineral.id,
    quantity: q.quantity,
    unit: q.unit,
    unit_price_usd: q.mineral.price,
    amount_myr: Math.round(totals.grossMyr * 100) / 100,
    message: q.message,
    email_status: "pending",
  });
  if (insertError) {
    console.error("create-quote insert failed", { message: insertError.message });
    return json(500, { error: "Gagal menyimpan sebutharga" });
  }

  // Best-effort email: Resend API first, Zoho SMTP as fallback.
  let emailStatus = "skipped";
  const resendKey = Deno.env.get("RESEND_API_KEY") ?? "";
  const resendFrom = Deno.env.get("RESEND_FROM") ?? "info@fsgminerals.trade";
  const salesEmail = Deno.env.get("SALES_EMAIL") ?? "info@fsgminerals.trade";
  const subject = `Sebutharga ${number} — FSG Minerals (${q.mineral.id})`;
  const text =
    `Salam ${q.name},\n\nTerima kasih atas enquiry anda.\n\n` +
    `Nombor sebutharga: ${number}\nMineral: ${q.mineral.id}\nKuantiti: ${q.quantity} ${q.unit}\n` +
    `Anggaran rujukan: RM ${totals.grossMyr.toFixed(2)} (kadar USD-MYR ${USD_MYR}, harga rujukan LME/Fastmarkets)\n\n` +
    `Ini anggaran automatik — pasukan FSG akan sahkan dan hantar sebutharga rasmi. Bukan invois.\n\nFIRST STRATEGIC GLOBAL SDN. BHD. 202601003838 (1665935-K)\ninfo@fsgminerals.trade`;
  if (resendKey) {
    try {
      const r = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { Authorization: `Bearer ${resendKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({ from: resendFrom, to: [q.email], cc: [salesEmail], subject, text }),
      });
      if (!r.ok) throw new Error(`Resend ${r.status}: ${(await r.text()).slice(0, 160)}`);
      emailStatus = "sent";
    } catch (e) {
      console.error("create-quote resend failed", { message: e instanceof Error ? e.message : "unknown" });
      emailStatus = "failed";
    }
  } else {
    const smtpUser = Deno.env.get("ZOHO_SMTP_USER") ?? "";
    const smtpPass = Deno.env.get("ZOHO_SMTP_PASS") ?? "";
    if (smtpUser && smtpPass) {
      try {
        const { default: nodemailer } = await import("npm:nodemailer@6.9.14");
        const transport = nodemailer.createTransport({
          host: "smtp.zoho.com",
          port: 465,
          secure: true,
          auth: { user: smtpUser, pass: smtpPass },
        });
        await transport.sendMail({ from: smtpUser, to: q.email, cc: salesEmail, subject, text });
        emailStatus = "sent";
      } catch (e) {
        console.error("create-quote email failed", { message: e instanceof Error ? e.message : "unknown" });
        emailStatus = "failed";
      }
    }
  }
  await service.from("fsg_quotes").update({ email_status: emailStatus }).eq("number", number);

  return json(200, {
    ok: true,
    number,
    mineral: q.mineral.id,
    quantity: q.quantity,
    unit: q.unit,
    amount_myr: Math.round(totals.grossMyr * 100) / 100,
    email_status: emailStatus,
    note: "Anggaran rujukan automatik. Sebutharga rasmi menyusul dari pasukan FSG.",
  });
});
