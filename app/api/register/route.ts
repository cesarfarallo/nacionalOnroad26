import { NextResponse } from "next/server";
import { registerSchema } from "@/lib/schema";
import { db } from "@/lib/supabase";

const hits = new Map<string, number[]>();
function limited(ip: string) {
  const now = Date.now();
  const arr = (hits.get(ip) ?? []).filter((t) => now - t < 10 * 60_000);
  arr.push(now);
  hits.set(ip, arr);
  return arr.length > 10;
}

export async function POST(req: Request) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0] ?? "unknown";
  if (limited(ip)) return NextResponse.json({ error: "Demasiados intentos" }, { status: 429 });
  const parsed = registerSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success)
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Datos inválidos" }, { status: 400 });
  const { entries, website: _w, ...person } = parsed.data;
  const sb = db();
  const { data: reg, error } = await sb.from("registrations").insert(person).select("id").single();
  if (error || !reg) return NextResponse.json({ error: "No se pudo guardar" }, { status: 500 });
  const { error: e2 } = await sb.from("entries").insert(
    entries.map((e) => ({ ...e, transponder: e.transponder || null, registration_id: reg.id })),
  );
  if (e2) {
    await sb.from("registrations").delete().eq("id", reg.id);
    return NextResponse.json({ error: "No se pudo guardar" }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
