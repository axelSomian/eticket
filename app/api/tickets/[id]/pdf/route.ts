import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { PDFDocument, rgb, StandardFonts, degrees } from "pdf-lib";
import QRCode from "qrcode";

// Ticket dimensions: 600 x 240 pts (landscape)
const W = 600;
const H = 240;

const GOLD = rgb(0.937, 0.682, 0.196);       // #EFB032
const DARK = rgb(0.063, 0.071, 0.094);        // #101218
const WHITE = rgb(1, 1, 1);
const GRAY = rgb(0.55, 0.55, 0.60);
const LIGHT = rgb(0.94, 0.94, 0.96);

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
    page.drawCircle({
      x: leftW + 1,
      y: i * dotStep,
      size: 4,
      color: DARK,
    });
  }

  // ── Zone centrale (infos invité) ────────────────────────────────
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

  // Badge VIP
  if (ticket.ticketType === "VIP") {
    const badgeX = cx + fontBold.widthOfTextAtSize(ticket.ticketNumber, 11) + 10;
    page.drawRectangle({ x: badgeX, y: H - 42, width: 34, height: 16, color: GOLD });
    page.drawText("VIP", {
      x: badgeX + 6,
      y: H - 37,
      size: 9,
      font: fontBold,
      color: DARK,
    });
  }

  // Nom de l'invité
  const fullName = `${ticket.firstName.toUpperCase()} ${ticket.lastName.toUpperCase()}`;
  const nameSize = fullName.length > 22 ? 20 : 24;
  page.drawText(fullName, {
    x: cx,
    y: H - 80,
    size: nameSize,
    font: fontBold,
    color: WHITE,
    maxWidth: qrX - cx - 16,
  });

  // Séparateur
  page.drawLine({
    start: { x: cx, y: H - 95 },
    end: { x: qrX - 16, y: H - 95 },
    thickness: 0.5,
    color: GRAY,
    opacity: 0.4,
  });

  // Infos
  const rows: { label: string; value: string }[] = [
    { label: "TYPE", value: ticket.ticketType === "VIP" ? "Billet VIP" : "Billet Standard" },
    ...(ticket.tableNumber ? [{ label: "TABLE", value: ticket.tableNumber }] : []),
    ...(ticket.email ? [{ label: "EMAIL", value: ticket.email }] : []),
  ];

  rows.forEach((row, i) => {
    const y = H - 122 - i * 30;
    page.drawText(row.label, { x: cx, y: y + 12, size: 7, font: fontBold, color: GOLD, opacity: 0.8 });
    page.drawText(row.value, { x: cx, y: y, size: 11, font: fontReg, color: LIGHT });
  });

  // ── QR Code ─────────────────────────────────────────────────────
  const qrData = JSON.stringify({ id: ticket.id, sig: ticket.signature });
  const qrPngBuffer = await QRCode.toBuffer(qrData, {
    errorCorrectionLevel: "H",
    margin: 1,
    width: qrSize * 2,
    color: { dark: "#101218", light: "#FFFFFF" },
  });

  const qrImage = await pdfDoc.embedPng(qrPngBuffer);
  const qrY = (H - qrSize) / 2;

  // Fond blanc autour du QR
  page.drawRectangle({ x: qrX - 6, y: qrY - 6, width: qrSize + 12, height: qrSize + 12, color: WHITE });
  page.drawImage(qrImage, { x: qrX, y: qrY, width: qrSize, height: qrSize });

  // Texte sous le QR
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

  const filename = `ticket-${ticket.ticketNumber}-${ticket.lastName.toLowerCase()}.pdf`;

  return new NextResponse(Buffer.from(pdfBytes), {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
