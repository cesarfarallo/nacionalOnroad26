"use client";
import { useState } from "react";
import { CATEGORIES, isNitro, type Category } from "@/lib/categories";
import BrandPicker from "./BrandPicker";

type Entry = { transponder: string; chassis_brand: string; engine_brand: string; esc_brand: string; tire_brand: string };
const empty: Entry = { transponder: "", chassis_brand: "", engine_brand: "", esc_brand: "", tire_brand: "" };
const input = "mt-1 w-full rounded-lg border border-white/20 bg-black/40 px-3 py-2";

export default function RegistrationForm() {
  const [p, setP] = useState({ first_name: "", last_name: "", nickname: "", email: "", phone: "", club: "", website: "" });
  const [sel, setSel] = useState<Partial<Record<Category, Entry>>>({});
  const [state, setState] = useState<"idle" | "sending" | "done">("idle");
  const [error, setError] = useState("");

  const toggle = (c: Category) =>
    setSel((s) => { const n = { ...s }; if (n[c]) delete n[c]; else n[c] = { ...empty }; return n; });
  const upd = (c: Category, k: keyof Entry, v: string) =>
    setSel((s) => ({ ...s, [c]: { ...s[c]!, [k]: v } }));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const entries = CATEGORIES.filter((c) => sel[c]).map((c) => ({ category: c, ...sel[c]! }));
    for (const en of entries)
      if (!en.chassis_brand.trim() || !en.engine_brand.trim() || !en.tire_brand.trim() || (!isNitro(en.category) && !en.esc_brand.trim()))
        return setError(`Completá chasis, motor${isNitro(en.category) ? "" : ", variador"} y gomas en ${en.category}`);
    setState("sending");
    const r = await fetch("/api/register", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...p, entries }),
    }).catch(() => null);
    if (r?.ok) return setState("done");
    setState("idle");
    setError((await r?.json().catch(() => null))?.error ?? "Error de conexión");
  }

  if (state === "done")
    return (
      <div className="m-4 rounded-2xl border border-emerald-400/40 bg-emerald-500/10 p-6 text-center">
        <h2 className="text-2xl font-black">¡Inscripción recibida!</h2>
        <p className="mt-2">Nos vemos en el Circuito Hernán Maticoli.</p>
      </div>
    );

  return (
    <form onSubmit={submit} className="space-y-6 p-4">
      <section className="grid gap-3 sm:grid-cols-2">
        {([["first_name", "Nombre *"], ["last_name", "Apellido *"], ["nickname", "Apodo"], ["email", "Email *"], ["phone", "Teléfono"], ["club", "Club"]] as const).map(([k, l]) => (
          <label key={k} className="text-sm font-semibold">
            {l}
            <input
              className={input} value={p[k]} required={l.endsWith("*")} type={k === "email" ? "email" : "text"}
              onChange={(e) => setP({ ...p, [k]: e.target.value })}
            />
          </label>
        ))}
        <input tabIndex={-1} autoComplete="off" aria-hidden className="hidden" value={p.website}
          onChange={(e) => setP({ ...p, website: e.target.value })} />
      </section>

      <section>
        <h2 className="text-lg font-black uppercase">Categorías</h2>
        <div className="mt-2 grid gap-2 sm:grid-cols-2">
          {CATEGORIES.map((c) => (
            <label key={c} className={`flex cursor-pointer items-center gap-3 rounded-lg border-2 p-3 font-bold ${sel[c] ? "border-sky-400 bg-sky-500/20" : "border-white/10"}`}>
              <input type="checkbox" checked={!!sel[c]} onChange={() => toggle(c)} className="h-5 w-5" />
              {c}
            </label>
          ))}
        </div>
      </section>

      {CATEGORIES.filter((c) => sel[c]).map((c) => (
        <section key={c} className="rounded-2xl border border-white/15 bg-white/5 p-4">
          <h3 className="text-xl font-black text-sky-300">{c}</h3>
          <label className="mt-2 block text-sm font-semibold">
            Nº de transponder (opcional)
            <input className={input} value={sel[c]!.transponder} onChange={(e) => upd(c, "transponder", e.target.value)} />
          </label>
          <BrandPicker kind="chassis" value={sel[c]!.chassis_brand} onChange={(v) => upd(c, "chassis_brand", v)} />
          <BrandPicker kind={isNitro(c) ? "engine_nitro" : "engine_eco"} value={sel[c]!.engine_brand} onChange={(v) => upd(c, "engine_brand", v)} />
          {!isNitro(c) && <BrandPicker kind="esc" value={sel[c]!.esc_brand} onChange={(v) => upd(c, "esc_brand", v)} />}
          <BrandPicker kind="tires" value={sel[c]!.tire_brand} onChange={(v) => upd(c, "tire_brand", v)} />
        </section>
      ))}

      {error && <p role="alert" className="rounded-lg bg-red-500/20 p-3 text-red-200">{error}</p>}
      <button
        disabled={state === "sending" || !Object.keys(sel).length}
        className="w-full rounded-xl bg-sky-500 py-3 text-lg font-black uppercase disabled:opacity-40"
      >
        {state === "sending" ? "Enviando…" : "Inscribirme"}
      </button>
    </form>
  );
}
