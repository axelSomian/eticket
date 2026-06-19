import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import UserManagement from "./UserManagement";

export default async function UsersPage() {
  const session = await requireAdmin();

  const users = await prisma.user.findMany({
    select: { id: true, username: true, role: true, createdAt: true },
    orderBy: { createdAt: "asc" },
  });

  return (
    <UserManagement
      initialUsers={users.map((u) => ({ ...u, createdAt: u.createdAt.toISOString() }))}
      currentUserId={session.userId}
    />
  );
}
