import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth";
import { fetchRows } from "@/lib/fetchRows";
import { db } from "@/lib/supabase";

export async function GET() {
  if (!(await isAdmin())) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  try {
    return NextResponse.json({ rows: await fetchRows() });
  } catch (e) {
    const detail = e instanceof Error ? e.message : (e as { message?: string })?.message ?? String(e);
    console.error("admin/registrations:", e);
    return NextResponse.json({ error: `Error de base de datos: ${detail}` }, { status: 500 });
  }
}

/** Elimina la inscripción completa de un piloto (sus entries se borran por `on delete cascade`). */
export async function DELETE(req: Request) {
  if (!(await isAdmin())) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  const body = await req.json().catch(() => null);
  const id = body?.registrationId;
  if (typeof id !== "string" || !/^[0-9a-f-]{36}$/i.test(id))
    return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });
  try {
    const { data, error } = await db().from("registrations").delete().eq("id", id).select("id");
    if (error) throw error;
    if (!data?.length) return NextResponse.json({ error: "La inscripción no existe (¿ya se eliminó?)" }, { status: 404 });
    return NextResponse.json({ ok: true });
  } catch (e) {
    const detail = e instanceof Error ? e.message : (e as { message?: string })?.message ?? String(e);
    console.error("admin/registrations DELETE:", e);
    return NextResponse.json({ error: `Error de base de datos: ${detail}` }, { status: 500 });
  }
}
