import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { PDFDocument, rgb, StandardFonts, degrees } from "pdf-lib";
import QRCode from "qrcode";

// Ticket dimensions: 600 x 240 pts (landscape)
const W = 600;
const H = 240;

const GOLD = rgb(0.941, 0.753, 0.251);       // #F0C040
const DARK = rgb(0.102, 0.059, 0.027);        // #1A0F07
const WHITE = rgb(1, 1, 1);
const GRAY = rgb(0.627, 0.502, 0.314);        // #A08050
const LIGHT = rgb(0.980, 0.941, 0.902);       // #FAF0E6

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const ticket = await prisma.ticket.findUnique({ where: { id } });

  if (!ticket) {
    return NextResponse.json({ error: "Ticket introuvable" }, { status: 404 });
  }

  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([W, H]);

  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const fontReg = await pdfDoc.embedFont(StandardFonts.Helvetica);

  // ── Background complet ──────────────────────────────────────────
  page.drawRectangle({ x: 0, y: 0, width: W, height: H, color: DARK });

  // ── Panneau gauche doré ─────────────────────────────────────────
  const leftW = 158;
  page.drawRectangle({ x: 0, y: 0, width: leftW, height: H, color: GOLD });

  // Titre vertical "GALA" dans le panneau gauche
  page.drawText("GALA", {
    x: 24,
    y: H / 2 - 46,
    size: 52,
    font: fontBold,
    color: DARK,
    rotate: degrees(90),
  });

  // Sous-titre
  page.drawText("DE RETROUVAILLES", {
    x: 72,
    y: H / 2 - 72,
    size: 10,
    font: fontBold,
    color: DARK,
    rotate: degrees(90),
  });

  // ── Séparateur perforé ──────────────────────────────────────────
  const dotCount = 18;
  const dotStep = H / (dotCount + 1);
  for (let i = 1; i <= dotCount; i++) {
    page.drawCircle({ x: leftW + 1, y: i * dotStep, size: 4, color: DARK });
  }

  // ── Zone centrale (infos ticket) ────────────────────────────────
  const cx = leftW + 22;
  const qrSize = 130;
  const qrX = W - qrSize - 20;

  // Numéro du ticket
  page.drawText(ticket.ticketNumber, {
    x: cx,
    y: H - 38,
    size: 11,
    font: fontBold,
    color: GOLD,
  });

  // Badge GBONHI
  if (ticket.ticketType === "GBONHI") {
    const badgeX = cx + fontBold.widthOfTextAtSize(ticket.ticketNumber, 11) + 10;
    page.drawRectangle({ x: badgeX, y: H - 42, width: 60, height: 16, color: GOLD });
    page.drawText("GBONHI", {
      x: badgeX + 5,
      y: H - 37,
      size: 9,
      font: fontBold,
      color: DARK,
    });
  }

  // Type d'offre en grand
  const offreLabel = ticket.ticketType === "GBONHI" ? "OFFRE GBONHI" : "BILLET INDIVIDUEL";
  page.drawText(offreLabel, {
    x: cx,
    y: H - 80,
    size: 20,
    font: fontBold,
    color: WHITE,
    maxWidth: qrX - cx - 16,
  });

  // Sous-label
  const sousLabel = ticket.ticketType === "GBONHI" ? "6 places incluses" : "1 place";
  page.drawText(sousLabel, {
    x: cx,
    y: H - 102,
    size: 10,
    font: fontReg,
    color: GRAY,
  });

  // Séparateur
  page.drawLine({
    start: { x: cx, y: H - 115 },
    end: { x: qrX - 16, y: H - 115 },
    thickness: 0.5,
    color: GRAY,
    opacity: 0.4,
  });

  // Infos
  const rows: { label: string; value: string }[] = [
    { label: "OFFRE", value: ticket.ticketType === "GBONHI" ? "Gbonhi — 50 mil" : "Individuel — 10 mil" },
  ];

  rows.forEach((row, i) => {
    const y = H - 140 - i * 30;
    page.drawText(row.label, { x: cx, y: y + 12, size: 7, font: fontBold, color: GOLD, opacity: 0.8 });
    page.drawText(row.value, { x: cx, y: y, size: 11, font: fontReg, color: LIGHT });
  });

  // ── QR Code ─────────────────────────────────────────────────────
  const qrData = JSON.stringify({ id: ticket.id, sig: ticket.signature });
  const qrPngBuffer = await QRCode.toBuffer(qrData, {
    errorCorrectionLevel: "H",
    margin: 1,
    width: qrSize * 2,
    color: { dark: "#1A0F07", light: "#FFFFFF" },
  });

  const qrImage = await pdfDoc.embedPng(qrPngBuffer);
  const qrY = (H - qrSize) / 2;

  page.drawRectangle({ x: qrX - 6, y: qrY - 6, width: qrSize + 12, height: qrSize + 12, color: WHITE });
  page.drawImage(qrImage, { x: qrX, y: qrY, width: qrSize, height: qrSize });

  page.drawText("Scanner à l'entrée", {
    x: qrX - 2,
    y: qrY - 18,
    size: 7,
    font: fontReg,
    color: GRAY,
  });

  // ── Pied de page ────────────────────────────────────────────────
  page.drawText("Ce ticket est personnel et non cessible • Ticket authentifié par signature cryptographique", {
    x: cx,
    y: 12,
    size: 6,
    font: fontReg,
    color: GRAY,
    opacity: 0.6,
  });

  const pdfBytes = await pdfDoc.save();

  return new NextResponse(Buffer.from(pdfBytes), {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="ticket-${ticket.ticketNumber}.pdf"`,
      "Cache-Control": "no-store",
    },
  });
}
