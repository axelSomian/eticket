import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { PDFDocument } from "pdf-lib";
import { generateTicketPDFPage, getGalaSettings } from "@/lib/gala-pdf";

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const idsParam = req.nextUrl.searchParams.get("ids") ?? "";
  const ids = idsParam.split(",").map((s) => s.trim()).filter(Boolean).slice(0, 20);

  if (ids.length === 0) {
    return NextResponse.json({ error: "Aucun id fourni" }, { status: 400 });
  }

  const [tickets, settings] = await Promise.all([
    prisma.ticket.findMany({ where: { id: { in: ids } }, orderBy: { ticketNumber: "asc" } }),
    getGalaSettings(),
  ]);

  const pdfDoc = await PDFDocument.create();
  for (const ticket of tickets) {
    await generateTicketPDFPage(pdfDoc, ticket, settings);
  }

  const pdfBytes = await pdfDoc.save();
  const firstName = tickets[0]?.ticketNumber ?? "gbonhi";

  return new NextResponse(Buffer.from(pdfBytes), {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="offre-gbonhi-${firstName}.pdf"`,
      "Cache-Control": "no-store",
    },
  });
}
