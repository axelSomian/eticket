import { NextRequest, NextResponse } from "next/server";
import { createSessionToken, SESSION_COOKIE_NAME, SessionRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

function getBaseUrl(req: NextRequest): string {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL;
  if (appUrl) return appUrl;
  const host = req.headers.get("host") || "localhost:3001";
  const proto = req.headers.get("x-forwarded-proto") || "http";
  return `${proto}://${host}`;
}

function isSafeRedirect(url: string): boolean {
  return typeof url === "string" && url.startsWith("/") && !url.startsWith("//");
}

export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const username = (formData.get("username") as string)?.trim();
  const password = formData.get("password") as string;
  const redirectParam = (formData.get("redirect") as string) || "";
  const redirectTo = isSafeRedirect(redirectParam) ? redirectParam : "";

  const base = getBaseUrl(req);
  const loginUrl = new URL("/login", base);
  if (redirectTo) loginUrl.searchParams.set("redirect", redirectTo);

  if (!username || !password) {
    loginUrl.searchParams.set("error", "1");
    return NextResponse.redirect(loginUrl, 303);
  }

  const user = await prisma.user.findUnique({ where: { username } }).catch(() => null);
  const valid = user ? await bcrypt.compare(password, user.password) : false;

  if (!valid || !user) {
    loginUrl.searchParams.set("error", "1");
    return NextResponse.redirect(loginUrl, 303);
  }

  const role: SessionRole = user.role === "ADMIN" ? "admin" : "scanner";
  const dest = redirectTo || (role === "admin" ? "/admin" : "/scan");
  const token = await createSessionToken(role, user.id, user.username);

  const res = NextResponse.redirect(new URL(dest, base), 303);
  res.cookies.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7,
    path: "/",
  });

  return res;
}
