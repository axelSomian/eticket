import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

async function requireAdmin() {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    return { error: NextResponse.json({ error: "Non autorisé" }, { status: 401 }) };
  }
  return { session };
}

export async function GET() {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;

  const tables = await prisma.table.findMany({
    orderBy: { number: "asc" },
    include: {
      _count: {
        select: { tickets: { where: { status: { in: ["VALID", "USED"] } } } },
      },
    },
  });

  const result = tables.map((t) => ({
    id: t.id,
    number: t.number,
    capacity: t.capacity,
    isActive: t.isActive,
    occupied: t._count.tickets,
    remaining: t.capacity - t._count.tickets,
    createdAt: t.createdAt,
  }));

  return NextResponse.json(result);
}

export async function POST(req: NextRequest) {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;

  const body = await req.json();
  const { number, capacity } = body;

  if (!number?.toString().trim()) {
    return NextResponse.json({ error: "Le numéro de table est requis" }, { status: 400 });
  }
  const cap = Number(capacity);
  if (!cap || cap < 1) {
    return NextResponse.json({ error: "La capacité doit être au moins 1" }, { status: 400 });
  }

  try {
    const table = await prisma.table.create({
      data: {
        number: number.toString().trim(),
        capacity: cap,
      },
    });
    return NextResponse.json(table, { status: 201 });
  } catch (err: unknown) {
    const e = err as { code?: string };
    if (e.code === "P2002") {
      return NextResponse.json({ error: "Ce numéro de table existe déjà" }, { status: 409 });
    }
    throw err;
  }
}
