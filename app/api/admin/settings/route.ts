import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  try {
    const rows = await prisma.$queryRaw<{ key: string; value: string }[]>`
      SELECT key, value FROM "GalaSettings"
    `;
    const map = Object.fromEntries(rows.map((r) => [r.key, r.value]));
    return NextResponse.json({
      lieu:  map.lieu  ?? "",
      date:  map.date  ?? "",
      heure: map.heure ?? "",
    });
  } catch {
    return NextResponse.json({ lieu: "", date: "", heure: "" });
  }
}

export async function PUT(req: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const body = await req.json();
  const lieu  = String(body.lieu  ?? "").trim();
  const date  = String(body.date  ?? "").trim();
  const heure = String(body.heure ?? "").trim();

  await prisma.$executeRaw`
    INSERT INTO "GalaSettings" (key, value)
    VALUES ('lieu', ${lieu}), ('date', ${date}), ('heure', ${heure})
    ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value
  `;

  return NextResponse.json({ ok: true });
}
