"use client";
import { useMemo, useState } from "react";
import { CATEGORIES, exclusiveWith, isGT, isNitro, isTouring, type Category } from "@/lib/categories";
import type { Row } from "@/lib/csv";
import { updateSchema } from "@/lib/schema";
import BrandPicker from "./BrandPicker";

type EntryDraft = {
  key: string; id?: string; category: Category; transponder: string;
  chassis_brand: string; engine_brand: string; esc_brand: string; tire_brand: string;
};
const field = "mt-1 w-full rounded-lg border border-white/20 bg-black/40 px-3 py-2 text-sm";
let seq = 0;
const nextKey = () => `n${++seq}`;

/** Edición de una inscripción (datos del piloto + categorías con sus marcas) desde el panel de administrador. */
export default function AdminEditDialog({
  rows, onClose, onSaved,
}: { rows: Row[]; onClose: () => void; onSaved: (msg: string) => void }) {
  const first = rows[0];
  const [p, setP] = useState({
    first_name: first.first_name, last_name: first.last_name, nickname: first.nickname ?? "", email: first.email,
    phone: first.phone ?? "", club: first.club ?? "", email_optin: first.email_optin,
  });
  const [entries, setEntries] = useState<EntryDraft[]>(() =>
    rows.map((r) => ({
      key: r.entry_id, id: r.entry_id, category: r.category as Category, transponder: r.transponder ?? "",
      chassis_brand: r.chassis_brand ?? "", engine_brand: r.engine_brand ?? "", esc_brand: r.esc_brand ?? "", tire_brand: r.tire_brand ?? "",
    })),
  );
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const used = useMemo(() => new Set(entries.map((e) => e.category)), [entries]);
  const blocked = (cat: Category, self?: Category) =>
    exclusiveWith(cat).some((x) => x !== self && used.has(x) && x !== cat); // choca con una categoría excluyente ya elegida
  const free = CATEGORIES.filter((c) => !used.has(c) && !exclusiveWith(c).some((x) => used.has(x)));

  const upd = (key: string, patch: Partial<EntryDraft>) =>
    setEntries((es) => es.map((e) => (e.key === key ? { ...e, ...patch } : e)));
  const changeCategory = (e: EntryDraft, category: Category) =>
    upd(e.key, {
      category,
      // al pasar de nitro a eco (o al revés) las marcas de motor/variador ya no corresponden
      ...(isNitro(category) !== isNitro(e.category) ? { engine_brand: "", esc_brand: "" } : {}),
      ...(isTouring(category) !== isTouring(e.category) && e.chassis_brand === "3Racing" ? { chassis_brand: "" } : {}),
    });

  async function save() {
    setError("");
    const body = {
      registrationId: first.registration_id, ...p,
      entries: entries.map(({ key: _k, ...e }) => e),
    };
    const check = updateSchema.safeParse(body);
    if (!check.success) { setError(check.error.issues[0]?.message ?? "Datos inválidos"); return; }
    setSaving(true);
    try {
      const r = await fetch("/api/admin/registrations", {
        method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(check.data),
      });
      const j = await r.json().catch(() => ({}));
      if (r.ok) onSaved(`Se guardaron los cambios de ${p.first_name} ${p.last_name}.`);
      else setError(j.error ?? "No se pudo guardar");
    } catch { setError("Error de conexión"); } finally { setSaving(false); }
  }

  return (
    <div role="dialog" aria-modal="true" aria-label="Editar inscripción"
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/70 p-3 sm:p-6">
      <div className="w-full max-w-3xl rounded-2xl border border-white/15 bg-[#0b1220] p-4 sm:p-5">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-xl font-black">Editar inscripción</h2>
          <button type="button" onClick={onClose} className="rounded-lg bg-white/10 px-3 py-1 text-sm">Cerrar</button>
        </div>

        <div className="mt-3 grid gap-2 sm:grid-cols-3">
          {([["first_name", "Nombre *"], ["last_name", "Apellido *"], ["email", "Email *"], ["nickname", "Apodo"], ["phone", "Teléfono"], ["club", "Club"]] as const).map(([k, l]) => (
            <label key={k} className="text-xs font-semibold">
              {l}
              <input className={field} value={p[k]} type={k === "email" ? "email" : "text"}
                onChange={(e) => setP({ ...p, [k]: e.target.value })} />
            </label>
          ))}
        </div>
        <label className="mt-3 flex items-center gap-2 text-sm">
          <input type="checkbox" className="h-5 w-5" checked={p.email_optin} onChange={(e) => setP({ ...p, email_optin: e.target.checked })} />
          Acepta recibir avisos por mail
        </label>

        <div className="mt-4 space-y-3">
          {entries.map((e) => (
            <section key={e.key} className="rounded-xl border border-white/15 bg-white/5 p-3">
              <div className="flex flex-wrap items-end gap-2">
                <label className="text-xs font-semibold">
                  Categoría
                  <select className={field} value={e.category} onChange={(ev) => changeCategory(e, ev.target.value as Category)}>
                    {CATEGORIES.map((c) => (
                      <option key={c} value={c} disabled={c !== e.category && (used.has(c) || blocked(c, e.category))}>{c}</option>
                    ))}
                  </select>
                </label>
                <label className="text-xs font-semibold">
                  Nº de transponder
                  <input className={field} value={e.transponder} inputMode="numeric" onChange={(ev) => upd(e.key, { transponder: ev.target.value })} />
                </label>
                <button type="button" disabled={entries.length === 1}
                  onClick={() => setEntries((es) => es.filter((x) => x.key !== e.key))}
                  className="ml-auto rounded-md border border-red-400/60 px-2 py-2 text-xs font-bold text-red-300 hover:bg-red-500/20 disabled:opacity-30">
                  Quitar categoría
                </button>
              </div>
              {/* key = categoría: al cambiarla se vuelve a armar cada selector con la lista que corresponde */}
              <BrandPicker key={`c-${e.category}`} kind={isTouring(e.category) ? "chassis_touring" : "chassis"} value={e.chassis_brand} onChange={(v) => upd(e.key, { chassis_brand: v })} />
              <BrandPicker key={`m-${e.category}`} kind={isNitro(e.category) ? "engine_nitro" : "engine_eco"} value={e.engine_brand} onChange={(v) => upd(e.key, { engine_brand: v })} />
              {!isNitro(e.category) && <BrandPicker key={`v-${e.category}`} kind="esc" value={e.esc_brand} onChange={(v) => upd(e.key, { esc_brand: v })} />}
              <BrandPicker key={`g-${e.category}`} kind={isGT(e.category) ? "tires_gt" : "tires"} value={e.tire_brand} onChange={(v) => upd(e.key, { tire_brand: v })} />
            </section>
          ))}
        </div>

        {free.length > 0 && (
          <div className="mt-3 flex flex-wrap items-center gap-2 text-sm">
            <span>Agregar categoría:</span>
            {free.map((c) => (
              <button key={c} type="button"
                onClick={() => setEntries((es) => [...es, { key: nextKey(), category: c, transponder: "", chassis_brand: "", engine_brand: "", esc_brand: "", tire_brand: "" }])}
                className="rounded-lg border border-sky-400/60 px-3 py-1 font-semibold text-sky-200 hover:bg-sky-500/20">
                + {c}
              </button>
            ))}
          </div>
        )}

        {error && <p role="alert" className="mt-3 rounded-lg bg-red-500/20 p-3 text-sm text-red-200">{error}</p>}
        <div className="mt-4 flex flex-wrap justify-end gap-2">
          <button type="button" onClick={onClose} className="rounded-lg bg-white/10 px-4 py-2">Cancelar</button>
          <button type="button" onClick={save} disabled={saving} className="rounded-lg bg-sky-500 px-5 py-2 font-black disabled:opacity-50">
            {saving ? "Guardando…" : "Guardar cambios"}
          </button>
        </div>
      </div>
    </div>
  );
}
