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

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;

  const { id } = await params;
  const body = await req.json();
  const { number, capacity, isActive } = body;

  const updateData: Record<string, unknown> = {};

  if (number !== undefined) {
    if (!number.toString().trim()) {
      return NextResponse.json({ error: "Le numéro de table est requis" }, { status: 400 });
    }
    updateData.number = number.toString().trim();
  }

  if (capacity !== undefined) {
    const cap = Number(capacity);
    if (!cap || cap < 1) {
      return NextResponse.json({ error: "La capacité doit être au moins 1" }, { status: 400 });
    }
    updateData.capacity = cap;
  }

  if (isActive !== undefined) {
    updateData.isActive = Boolean(isActive);
  }

  try {
    const table = await prisma.table.update({
      where: { id },
      data: updateData,
    });
    return NextResponse.json(table);
  } catch (err: unknown) {
    const e = err as { code?: string };
    if (e.code === "P2002") {
      return NextResponse.json({ error: "Ce numéro de table existe déjà" }, { status: 409 });
    }
    if (e.code === "P2025") {
      return NextResponse.json({ error: "Table introuvable" }, { status: 404 });
    }
    throw err;
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;

  const { id } = await params;

  const ticketCount = await prisma.ticket.count({ where: { tableId: id } });
  if (ticketCount > 0) {
    return NextResponse.json(
      { error: "Impossible de supprimer une table avec des tickets assignés" },
      { status: 400 }
    );
  }

  try {
    await prisma.table.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const e = err as { code?: string };
    if (e.code === "P2025") {
      return NextResponse.json({ error: "Table introuvable" }, { status: 404 });
    }
    throw err;
  }
}
