import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth";
import { fetchRows } from "@/lib/fetchRows";
import { db } from "@/lib/supabase";
import { updateSchema } from "@/lib/schema";

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

const errText = (e: unknown) => (e instanceof Error ? e.message : (e as { message?: string })?.message ?? String(e));

/**
 * Edita una inscripción completa: datos del piloto y todas sus categorías (se pueden cambiar, agregar y quitar).
 * Supabase no ofrece transacciones desde acá, así que se aplica en orden (borrar → actualizar → insertar) y,
 * si algo falla a mitad de camino, se restaura lo que había antes.
 */
export async function PATCH(req: Request) {
  if (!(await isAdmin())) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  const parsed = updateSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success)
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Datos inválidos" }, { status: 400 });
  const { registrationId: id, entries, ...person } = parsed.data;
  const sb = db();

  const { data: reg, error: e1 } = await sb.from("registrations").select("*").eq("id", id).maybeSingle();
  if (e1) return NextResponse.json({ error: `Error de base de datos: ${errText(e1)}` }, { status: 500 });
  if (!reg) return NextResponse.json({ error: "La inscripción no existe (¿ya se eliminó?)" }, { status: 404 });
  const { data: orig, error: e2 } = await sb.from("entries").select("*").eq("registration_id", id);
  if (e2 || !orig) return NextResponse.json({ error: `Error de base de datos: ${errText(e2)}` }, { status: 500 });

  const values = (e: (typeof entries)[number]) => ({
    category: e.category, transponder: e.transponder || null, chassis_brand: e.chassis_brand,
    engine_brand: e.engine_brand, esc_brand: e.esc_brand || null, tire_brand: e.tire_brand,
  });
  const origById = new Map(orig.map((o) => [o.id as string, o]));
  const keep: { id: string; row: ReturnType<typeof values> }[] = [];
  const add: ReturnType<typeof values>[] = [];
  for (const e of entries) {
    const o = e.id ? origById.get(e.id) : undefined;
    // misma categoría → se actualiza; categoría nueva o cambiada → se borra y se vuelve a crear (evita choques con unique)
    if (o && o.category === e.category) keep.push({ id: o.id, row: values(e) });
    else add.push(values(e));
  }
  const keepIds = new Set(keep.map((k) => k.id));
  const remove = orig.filter((o) => !keepIds.has(o.id));

  try {
    const personRow = {
      first_name: person.first_name, last_name: person.last_name, nickname: person.nickname || null,
      email: person.email, phone: person.phone || null, club: person.club || null, email_optin: person.email_optin,
    };
    const r1 = await sb.from("registrations").update(personRow).eq("id", id);
    if (r1.error) throw r1.error;
    if (remove.length) {
      const r2 = await sb.from("entries").delete().in("id", remove.map((o) => o.id));
      if (r2.error) throw r2.error;
    }
    for (const k of keep) {
      const r3 = await sb.from("entries").update(k.row).eq("id", k.id);
      if (r3.error) throw r3.error;
    }
    if (add.length) {
      const r4 = await sb.from("entries").insert(add.map((row) => ({ ...row, registration_id: id })));
      if (r4.error) throw r4.error;
    }
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("admin/registrations PATCH:", e);
    // restaurar el estado anterior (mejor esfuerzo)
    try {
      const { id: _i, ...regBack } = reg;
      await sb.from("registrations").update(regBack).eq("id", id);
      const { data: now } = await sb.from("entries").select("id").eq("registration_id", id);
      const stay = new Set(orig.map((o) => o.id));
      const extra = (now ?? []).filter((n) => !stay.has(n.id)).map((n) => n.id);
      if (extra.length) await sb.from("entries").delete().in("id", extra);
      const present = new Set((now ?? []).map((n) => n.id));
      const missing = orig.filter((o) => !present.has(o.id));
      if (missing.length) await sb.from("entries").insert(missing);
      for (const o of orig.filter((o) => present.has(o.id))) {
        const { id: oid, registration_id: _r, ...back } = o;
        await sb.from("entries").update(back).eq("id", oid);
      }
    } catch (re) { console.error("rollback:", re); }
    return NextResponse.json({ error: `No se pudo guardar (se restauró lo anterior): ${errText(e)}` }, { status: 500 });
  }
}
