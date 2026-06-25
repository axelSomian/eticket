import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyTicketSignature } from "@/lib/crypto";
import { getSession } from "@/lib/auth";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const { id } = await params;
  const body = await req.json();
  const { sig } = body;

  if (!sig) {
    return NextResponse.json({ result: "INVALID", reason: "Données QR invalides" }, { status: 400 });
  }

  try {
    const ticket = await prisma.ticket.findUnique({ where: { id } });

    if (!ticket) {
      return NextResponse.json({ result: "INVALID", reason: "Ticket introuvable" }, { status: 404 });
    }

    if (!verifyTicketSignature(ticket.id, ticket.ticketNumber, sig)) {
      return NextResponse.json({ result: "FAKE", reason: "Signature invalide — faux ticket" });
    }

    if (ticket.status === "CANCELLED") {
      return NextResponse.json({ result: "CANCELLED", reason: "Ce ticket est annulé — réactivation impossible" });
    }

    if (ticket.status === "VALID") {
      return NextResponse.json({
        result: "ALREADY_VALID",
        reason: "Ce ticket est déjà valide",
        ticket: { ticketNumber: ticket.ticketNumber, ticketType: ticket.ticketType },
      });
    }

    // USED → VALID
    await prisma.ticket.update({
      where: { id },
      data: { status: "VALID", usedAt: null, scannedBy: null },
    });

    return NextResponse.json({
      result: "REACTIVATED",
      ticket: { ticketNumber: ticket.ticketNumber, ticketType: ticket.ticketType },
    });
  } catch {
    return NextResponse.json({ result: "ERROR", reason: "Erreur serveur" }, { status: 500 });
  }
}
