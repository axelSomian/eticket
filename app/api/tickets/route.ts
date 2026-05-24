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
      ...(search
        ? {
            OR: [
              { firstName: { contains: search, mode: "insensitive" } },
              { lastName: { contains: search, mode: "insensitive" } },
              { email: { contains: search, mode: "insensitive" } },
              { ticketNumber: { contains: search, mode: "insensitive" } },
            ],
          }
        : {}),
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
  const { firstName, lastName, email, phone, ticketType, tableNumber, note } = body;

  if (!firstName?.trim() || !lastName?.trim()) {
    return NextResponse.json({ error: "Prénom et nom requis" }, { status: 400 });
  }

  const count = await prisma.ticket.count();
  const ticketNumber = generateTicketNumber(count + 1);

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
    data: {
      id,
      ticketNumber,
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email: email?.trim() || null,
      phone: phone?.trim() || null,
      ticketType: ticketType === "VIP" ? "VIP" : "STANDARD",
      tableNumber: tableNumber?.trim() || null,
      note: note?.trim() || null,
      signature,
    },
  });

  return NextResponse.json({ ticket, qrCodeDataUrl }, { status: 201 });
}
