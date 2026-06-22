import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { signTicket, generateTicketNumber } from "@/lib/crypto";
import { getSession } from "@/lib/auth";
import QRCode from "qrcode";

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");
  const search = searchParams.get("search");

  const tickets = await prisma.ticket.findMany({
    where: {
      ...(status ? { status: status as "VALID" | "USED" | "CANCELLED" } : {}),
      ...(search ? { ticketNumber: { contains: search, mode: "insensitive" } } : {}),
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(tickets);
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const body = await req.json();
  const { ticketType, note, holderName } = body;

  const type = ticketType === "GBONHI" ? "GBONHI" : "INDIVIDUEL";
  const quantity = type === "GBONHI" ? 6 : 1;

  const baseCount = await prisma.ticket.count();

  const tickets = [];
  const qrCodes = [];

  for (let i = 0; i < quantity; i++) {
    const ticketNumber = generateTicketNumber(baseCount + i + 1);
    const id = crypto.randomUUID();
    const signature = signTicket(id, ticketNumber);

    const qrData = JSON.stringify({ id, sig: signature });
    const qrCodeDataUrl = await QRCode.toDataURL(qrData, {
      errorCorrectionLevel: "H",
      margin: 2,
      width: 300,
      color: { dark: "#000000", light: "#ffffff" },
    });

    const ticket = await prisma.ticket.create({
      data: { id, ticketNumber, ticketType: type, holderName: holderName?.trim() || null, note: note?.trim() || null, signature },
    });

    tickets.push(ticket);
    qrCodes.push(qrCodeDataUrl);
  }

  return NextResponse.json({ tickets, qrCodes }, { status: 201 });
}
