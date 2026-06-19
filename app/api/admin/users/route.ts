import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function GET() {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const users = await prisma.user.findMany({
    select: { id: true, username: true, role: true, createdAt: true },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json(users);
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const username = (body.username as string)?.trim();
  const password = body.password as string;
  const role = body.role as "ADMIN" | "SCANNER";

  if (!username || !password || !["ADMIN", "SCANNER"].includes(role)) {
    return NextResponse.json({ error: "Données invalides" }, { status: 400 });
  }

  if (username.length < 3 || username.length > 50) {
    return NextResponse.json({ error: "Le nom doit faire entre 3 et 50 caractères" }, { status: 400 });
  }

  if (password.length < 6 || password.length > 128) {
    return NextResponse.json({ error: "Le mot de passe doit faire entre 6 et 128 caractères" }, { status: 400 });
  }

  if (!/^[a-zA-Z0-9_\-\.]+$/.test(username)) {
    return NextResponse.json({ error: "Nom d'utilisateur invalide (lettres, chiffres, _ - . uniquement)" }, { status: 400 });
  }

  const existing = await prisma.user.findUnique({ where: { username } });
  if (existing) {
    return NextResponse.json({ error: "Ce nom d'utilisateur existe déjà" }, { status: 409 });
  }

  const hash = await bcrypt.hash(password, 12);
  const user = await prisma.user.create({
    data: { username, password: hash, role },
    select: { id: true, username: true, role: true, createdAt: true },
  });

  return NextResponse.json(user, { status: 201 });
}
