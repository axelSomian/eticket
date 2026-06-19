import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyTicketSignature } from "@/lib/crypto";
import { getSession } from "@/lib/auth";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const { id } = await params;
  const body = await req.json();
  const { sig, scannedBy } = body;

  if (!sig) {
    return NextResponse.json({ result: "INVALID", reason: "Données QR invalides" }, { status: 400 });
  }

  try {
    // Transaction atomique — empêche le double scan concurrent
    const ticket = await prisma.$transaction(async (tx) => {
      const t = await tx.ticket.findUnique({
        where: { id },
        include: { table: { select: { number: true } } },
      });

      if (!t) {
        throw Object.assign(new Error("NOT_FOUND"), { code: "NOT_FOUND" });
      }

      if (!verifyTicketSignature(t.id, t.ticketNumber, sig)) {
        throw Object.assign(new Error("FAKE"), { code: "FAKE" });
      }

      if (t.status === "CANCELLED") {
        throw Object.assign(new Error("CANCELLED"), { code: "CANCELLED", ticket: t });
      }

      if (t.status === "USED") {
        throw Object.assign(new Error("ALREADY_USED"), { code: "ALREADY_USED", ticket: t });
      }

      return tx.ticket.update({
        where: { id },
        data: {
          status: "USED",
          usedAt: new Date(),
          scannedBy: scannedBy || "Scanner",
        },
        include: { table: { select: { number: true } } },
      });
    });

    return NextResponse.json({
      result: "VALID",
      ticket: {
        ticketNumber: ticket.ticketNumber,
        firstName: ticket.firstName,
        lastName: ticket.lastName,
        ticketType: ticket.ticketType,
        tableNumber: ticket.table?.number ?? null,
      },
    });
  } catch (err: unknown) {
    const e = err as { code?: string; ticket?: { usedAt?: Date | null; ticketNumber?: string; firstName?: string; lastName?: string } };

    if (e.code === "NOT_FOUND") {
      return NextResponse.json({ result: "INVALID", reason: "Ticket introuvable" }, { status: 404 });
    }
    if (e.code === "FAKE") {
      return NextResponse.json({ result: "FAKE", reason: "Signature invalide — faux ticket" }, { status: 200 });
    }
    if (e.code === "CANCELLED") {
      return NextResponse.json({ result: "CANCELLED", reason: "Ce ticket a été annulé", ticket: e.ticket }, { status: 200 });
    }
    if (e.code === "ALREADY_USED") {
      const usedAt = e.ticket?.usedAt
        ? new Date(e.ticket.usedAt).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })
        : "inconnu";
      return NextResponse.json({
        result: "ALREADY_USED",
        reason: `Ticket déjà scanné à ${usedAt}`,
        ticket: e.ticket,
      }, { status: 200 });
    }

    return NextResponse.json({ result: "ERROR", reason: "Erreur serveur" }, { status: 500 });
  }
}
