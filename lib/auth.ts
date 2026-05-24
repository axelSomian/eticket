import { cookies } from "next/headers";
import { redirect } from "next/navigation";

const SESSION_COOKIE = "gala_session";

export type SessionRole = "admin" | "scanner";

export async function getSession(): Promise<{ role: SessionRole } | null> {
  const cookieStore = await cookies();
  const raw = cookieStore.get(SESSION_COOKIE)?.value;
  if (!raw) return null;
  try {
    const parsed = JSON.parse(Buffer.from(raw, "base64").toString("utf-8"));
    if (parsed.role === "admin" || parsed.role === "scanner") {
      return { role: parsed.role };
    }
    return null;
  } catch {
    return null;
  }
}

export function createSessionToken(role: SessionRole): string {
  return Buffer.from(JSON.stringify({ role })).toString("base64");
}

export async function requireAdmin() {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    redirect("/login?redirect=/admin");
  }
  return session;
}

export async function requireScanner() {
  const session = await getSession();
  if (!session) {
    redirect("/login?redirect=/scan");
  }
  return session;
}

export const SESSION_COOKIE_NAME = SESSION_COOKIE;
