import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { PDFDocument } from "pdf-lib";
import { generateTicketPDFPage, getGalaSettings } from "@/lib/gala-pdf";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const [ticket, settings] = await Promise.all([
    prisma.ticket.findUnique({ where: { id } }),
    getGalaSettings(),
  ]);

  if (!ticket) {
    return NextResponse.json({ error: "Ticket introuvable" }, { status: 404 });
  }

  const pdfDoc = await PDFDocument.create();
  await generateTicketPDFPage(pdfDoc, ticket, settings);
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
