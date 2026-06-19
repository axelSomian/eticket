import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import TableManagement from "./TableManagement";

export default async function TablesPage() {
  await requireAdmin();

  const tables = await prisma.table.findMany({
    orderBy: { number: "asc" },
    include: {
      _count: {
        select: { tickets: { where: { status: { in: ["VALID", "USED"] } } } },
      },
    },
  });

  const initialTables = tables.map((t) => ({
    id: t.id,
    number: t.number,
    capacity: t.capacity,
    isActive: t.isActive,
    occupied: t._count.tickets,
    remaining: t.capacity - t._count.tickets,
    createdAt: t.createdAt.toISOString(),
  }));

  return <TableManagement initialTables={initialTables} />;
}
