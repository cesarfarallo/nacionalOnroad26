import { NextResponse } from "next/server";
import { ADMIN_COOKIE, makeToken, safeEqual } from "@/lib/auth";

export async function POST(req: Request) {
  const { password } = await req.json().catch(() => ({ password: "" }));
  const real = process.env.ADMIN_PASSWORD;
  if (!real || !process.env.SESSION_SECRET || typeof password !== "string" || !safeEqual(password, real))
    return NextResponse.json({ error: "Clave incorrecta" }, { status: 401 });
  const res = NextResponse.json({ ok: true });
  res.cookies.set(ADMIN_COOKIE, makeToken(), {
    httpOnly: true, sameSite: "strict", secure: process.env.NODE_ENV === "production",
    path: "/", maxAge: 12 * 3600,
  });
  return res;
}
