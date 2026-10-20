/** Minimal FSG document PDF builder on top of pdf-lib (pure JS, edge-safe). */
import { PDFDocument, StandardFonts, rgb } from "npm:pdf-lib@1.17.1";
import { fmtMYR } from "./pricing.ts";

export interface DocLine {
  label: string;
  value: string;
}

export interface DocInput {
  kind: "SEBUTHARGA" | "INVOIS";
  number: string;
  refNumber: string | null;
  dateISO: string;
  billName: string;
  billEmail: string;
  billCompany: string | null;
  lines: DocLine[];
  totalMyr: number;
  footerNote: string;
}

const INK = rgb(0.11, 0.15, 0.13);
const GREEN = rgb(0.055, 0.478, 0.322);
const MUTED = rgb(0.36, 0.44, 0.4);

export async function buildDocPdf(d: DocInput): Promise<Uint8Array> {
  const pdf = await PDFDocument.create();
  const page = pdf.addPage([595, 842]);
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const { height } = page.getSize();
  let y = height - 56;

  page.drawText("FIRST STRATEGIC GLOBAL SDN. BHD.", { x: 48, y, size: 13, font: bold, color: INK });
  y -= 16;
  page.drawText("202601003838 (1665935-K)  •  info@fsgminerals.trade", { x: 48, y, size: 9, font, color: MUTED });
  y -= 22;
  page.drawLine({ start: { x: 48, y }, end: { x: 547, y }, thickness: 2, color: GREEN });
  y -= 28;

  page.drawText(d.kind, { x: 48, y, size: 22, font: bold, color: GREEN });
  y -= 20;
  page.drawText(`No: ${d.number}`, { x: 48, y, size: 11, font: bold, color: INK });
  y -= 15;
  if (d.refNumber) {
    page.drawText(`Rujukan: ${d.refNumber}`, { x: 48, y, size: 10, font, color: MUTED });
    y -= 15;
  }
  page.drawText(`Tarikh: ${d.dateISO}`, { x: 48, y, size: 10, font, color: MUTED });
  y -= 28;

  page.drawText("Bil Kepada:", { x: 48, y, size: 10, font: bold, color: INK });
  y -= 15;
  page.drawText(d.billName + (d.billCompany ? ` (${d.billCompany})` : ""), { x: 48, y, size: 10, font, color: INK });
  y -= 15;
  page.drawText(d.billEmail, { x: 48, y, size: 10, font, color: INK });
  y -= 28;

  for (const line of d.lines) {
    page.drawText(line.label, { x: 48, y, size: 10, font, color: MUTED });
    const w = bold.widthOfTextAtSize(line.value, 10);
    page.drawText(line.value, { x: 547 - w, y, size: 10, font: bold, color: INK });
    y -= 17;
  }
  y -= 6;
  page.drawLine({ start: { x: 48, y }, end: { x: 547, y }, thickness: 1, color: GREEN });
  y -= 22;
  page.drawText("Jumlah:", { x: 48, y, size: 12, font: bold, color: INK });
  const total = fmtMYR(d.totalMyr);
  const tw = bold.widthOfTextAtSize(total, 13);
  page.drawText(total, { x: 547 - tw, y, size: 13, font: bold, color: GREEN });
  y -= 40;

  const words = d.footerNote.split(" ");
  let lineText = "";
  for (const word of words) {
    const trial = lineText ? lineText + " " + word : word;
    if (font.widthOfTextAtSize(trial, 9) > 499) {
      page.drawText(lineText, { x: 48, y, size: 9, font, color: MUTED });
      y -= 13;
      lineText = word;
    } else {
      lineText = trial;
    }
  }
  if (lineText) page.drawText(lineText, { x: 48, y, size: 9, font, color: MUTED });

  return await pdf.save();
}
