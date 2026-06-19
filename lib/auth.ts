import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { SignJWT, jwtVerify } from "jose";
import { createHmac } from "crypto";

const SESSION_COOKIE = "gala_session";

function getSessionSecret(): Uint8Array {
  const raw = process.env.SESSION_SECRET || process.env.HMAC_SECRET || "";
  // Always derive a 32-byte key regardless of input length
  return createHmac("sha256", "gala-session-v1").update(raw).digest();
}

export type SessionRole = "admin" | "scanner";

export type SessionPayload = {
  role: SessionRole;
  userId: string;
  username: string;
};

export async function getSession(): Promise<SessionPayload | null> {
  const cookieStore = await cookies();
  const raw = cookieStore.get(SESSION_COOKIE)?.value;
  if (!raw) return null;
  try {
    const { payload } = await jwtVerify(raw, getSessionSecret());
    const { role, userId, username } = payload as Record<string, string>;
    if ((role === "admin" || role === "scanner") && userId && username) {
      return { role: role as SessionRole, userId, username };
    }
    return null;
  } catch {
    return null;
  }
}

export async function createSessionToken(
  role: SessionRole,
  userId: string,
  username: string
): Promise<string> {
  return new SignJWT({ role, userId, username })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(getSessionSecret());
}

export async function requireAdmin(): Promise<SessionPayload> {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    redirect("/login?redirect=/admin");
  }
  return session;
}

export async function requireScanner(): Promise<SessionPayload> {
  const session = await getSession();
  if (!session) {
    redirect("/login?redirect=/scan");
  }
  return session as SessionPayload;
}

export const SESSION_COOKIE_NAME = SESSION_COOKIE;
