import { NextRequest, NextResponse } from "next/server";
import { createSessionToken, SESSION_COOKIE_NAME } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const password = formData.get("password") as string;
  const redirectTo = (formData.get("redirect") as string) || "";

  const adminPassword = process.env.ADMIN_PASSWORD;
  const scannerPassword = process.env.SCANNER_PASSWORD;

  let role: "admin" | "scanner" | null = null;
  if (password === adminPassword) role = "admin";
  else if (password === scannerPassword) role = "scanner";

  if (!role) {
    const host = req.headers.get("host") || "localhost:3001";
    const proto = req.headers.get("x-forwarded-proto") || "http";
    const loginUrl = new URL("/login", `${proto}://${host}`);
    loginUrl.searchParams.set("error", "1");
    if (redirectTo) loginUrl.searchParams.set("redirect", redirectTo);
    return NextResponse.redirect(loginUrl, 303);
  }

  const dest = redirectTo || (role === "admin" ? "/admin" : "/scan");
  const token = createSessionToken(role);

  const host = req.headers.get("host") || "localhost:3001";
  const proto = req.headers.get("x-forwarded-proto") || "http";
  const base = `${proto}://${host}`;

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
