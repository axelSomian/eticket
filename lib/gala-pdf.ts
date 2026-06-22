import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import QRCode from "qrcode";

export type GalaSettings = { lieu: string; date: string; heure: string };

const W = 400;
const H = 670;

const GOLD   = rgb(0.941, 0.753, 0.251);  // #F0C040
const DARK   = rgb(0.102, 0.059, 0.027);  // #1A0F07
const WHITE  = rgb(1, 1, 1);
const GRAY   = rgb(0.627, 0.502, 0.314);  // #A08050
const LIGHT  = rgb(0.980, 0.941, 0.902);  // #FAF0E6

function cx(font: ReturnType<PDFDocument["embedFont"]> extends Promise<infer T> ? T : never, text: string, size: number): number {
  return (W - (font as { widthOfTextAtSize(t: string, s: number): number }).widthOfTextAtSize(text, size)) / 2;
}

export async function generateTicketPDFPage(
  pdfDoc: PDFDocument,
  ticket: { id: string; ticketNumber: string; ticketType: string; signature: string },
  settings: GalaSettings
) {
  const page     = pdfDoc.addPage([W, H]);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const fontReg  = await pdfDoc.embedFont(StandardFonts.Helvetica);

  const isGbonhi = ticket.ticketType === "GBONHI";

  // ── Fond sombre ──────────────────────────────────────────────────
  page.drawRectangle({ x: 0, y: 0, width: W, height: H, color: DARK });

  // ── Bandeau doré (header) ────────────────────────────────────────
  const hdrH = 100;
  const hdrY = H - hdrH;
  page.drawRectangle({ x: 0, y: hdrY, width: W, height: hdrH, color: GOLD });

  const offreTag = isGbonhi ? "OFFRE GBONHI — 6 PLACES" : "BILLET INDIVIDUEL";
  page.drawText(offreTag, {
    x: cx(fontBold, offreTag, 8),
    y: H - 18,
    size: 8,
    font: fontBold,
    color: DARK,
    opacity: 0.55,
  });

  page.drawText(ticket.ticketNumber, {
    x: cx(fontBold, ticket.ticketNumber, 26),
    y: H - 56,
    size: 26,
    font: fontBold,
    color: DARK,
  });

  const placesText = isGbonhi ? "6 personnes incluses" : "1 personne";
  page.drawText(placesText, {
    x: cx(fontReg, placesText, 9),
    y: H - 82,
    size: 9,
    font: fontReg,
    color: DARK,
    opacity: 0.65,
  });

  // ── Séparateur perforé ───────────────────────────────────────────
  const dotY = hdrY;
  // Demi-cercles latéraux (effet encoche)
  page.drawCircle({ x: -5, y: dotY, size: 13, color: DARK });
  page.drawCircle({ x: W + 5, y: dotY, size: 13, color: DARK });
  // Pointillés
  const dotCount = 26;
  for (let i = 1; i <= dotCount; i++) {
    page.drawCircle({ x: (W / (dotCount + 1)) * i, y: dotY, size: 3, color: DARK });
  }

  // ── Titre de la cérémonie ────────────────────────────────────────
  const titleY = dotY - 26;
  const line1   = "CONNEXION DES GÉNÉRATIONS";
  const line2   = "Héritage d'Excellence";
  page.drawText(line1, {
    x: cx(fontBold, line1, 13),
    y: titleY,
    size: 13,
    font: fontBold,
    color: WHITE,
  });
  page.drawText(line2, {
    x: cx(fontReg, line2, 10),
    y: titleY - 18,
    size: 10,
    font: fontReg,
    color: GOLD,
  });

  // ── Séparateur ───────────────────────────────────────────────────
  const sep1Y = titleY - 36;
  page.drawLine({ start: { x: 40, y: sep1Y }, end: { x: W - 40, y: sep1Y }, thickness: 0.4, color: GRAY, opacity: 0.4 });

  // ── Infos lieu / date / heure ────────────────────────────────────
  const infoStartY = sep1Y - 14;
  const rowH = 36;
  const infoRows = [
    { label: "LIEU",  value: settings.lieu  || "À définir" },
    { label: "DATE",  value: settings.date  || "À définir" },
    { label: "HEURE", value: settings.heure || "À définir" },
  ];

  infoRows.forEach((row, i) => {
    const ry = infoStartY - i * rowH;
    page.drawText(row.label, { x: 50, y: ry, size: 7, font: fontBold, color: GOLD, opacity: 0.8 });
    page.drawText(row.value, { x: 50, y: ry - 14, size: 11, font: fontReg, color: LIGHT });
  });

  // ── Séparateur ───────────────────────────────────────────────────
  const sep2Y = infoStartY - infoRows.length * rowH - 6;
  page.drawLine({ start: { x: 40, y: sep2Y }, end: { x: W - 40, y: sep2Y }, thickness: 0.4, color: GRAY, opacity: 0.4 });

  // ── QR Code ──────────────────────────────────────────────────────
  const qrSize = 165;
  const qrX    = (W - qrSize) / 2;
  const qrY    = sep2Y - qrSize - 28;

  const qrData = JSON.stringify({ id: ticket.id, sig: ticket.signature });
  const qrBuf  = await QRCode.toBuffer(qrData, {
    errorCorrectionLevel: "H",
    margin: 1,
    width: qrSize * 2,
    color: { dark: "#1A0F07", light: "#FFFFFF" },
  });
  const qrImg = await pdfDoc.embedPng(qrBuf);

  page.drawRectangle({ x: qrX - 8, y: qrY - 8, width: qrSize + 16, height: qrSize + 16, color: WHITE });
  page.drawImage(qrImg, { x: qrX, y: qrY, width: qrSize, height: qrSize });

  const scanLabel = "Présenter ce QR code à l'entrée";
  page.drawText(scanLabel, {
    x: cx(fontReg, scanLabel, 7.5),
    y: qrY - 18,
    size: 7.5,
    font: fontReg,
    color: GRAY,
  });

  // ── Séparateur bas ───────────────────────────────────────────────
  const sep3Y = qrY - 34;
  page.drawLine({ start: { x: 40, y: sep3Y }, end: { x: W - 40, y: sep3Y }, thickness: 0.4, color: GRAY, opacity: 0.4 });

  // ── Numéro de ticket ─────────────────────────────────────────────
  page.drawText(ticket.ticketNumber, {
    x: cx(fontBold, ticket.ticketNumber, 10),
    y: sep3Y - 16,
    size: 10,
    font: fontBold,
    color: GOLD,
  });

  // ── Mention légale professionnelle ───────────────────────────────
  const m1 = "Billet strictement personnel et intransmissible · Valable pour une seule admission";
  const m2 = "Toute reproduction ou falsification est interdite · Conservation obligatoire jusqu'à l'entrée";
  page.drawText(m1, { x: cx(fontReg, m1, 5.5), y: sep3Y - 32, size: 5.5, font: fontReg, color: GRAY, opacity: 0.65 });
  page.drawText(m2, { x: cx(fontReg, m2, 5.5), y: sep3Y - 42, size: 5.5, font: fontReg, color: GRAY, opacity: 0.65 });
}

export async function getGalaSettings(): Promise<GalaSettings> {
  try {
    // Dynamic import to avoid circular deps at module load time
    const { prisma } = await import("@/lib/prisma");
    const rows = await prisma.$queryRaw<{ key: string; value: string }[]>`
      SELECT key, value FROM "GalaSettings"
    `;
    const map = Object.fromEntries(rows.map((r) => [r.key, r.value]));
    return {
      lieu:  map.lieu  ?? "",
      date:  map.date  ?? "",
      heure: map.heure ?? "",
    };
  } catch {
    return { lieu: "", date: "", heure: "" };
  }
}
