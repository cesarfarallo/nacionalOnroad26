"use client";
import { useState } from "react";
import { CATEGORIES, exclusiveWith, isGT, isNitro, type Category } from "@/lib/categories";
import BrandPicker from "./BrandPicker";

type Entry = { transponder: string; chassis_brand: string; engine_brand: string; esc_brand: string; tire_brand: string };
const empty: Entry = { transponder: "", chassis_brand: "", engine_brand: "", esc_brand: "", tire_brand: "" };
const input = "mt-1 w-full rounded-lg border border-white/20 bg-black/40 px-3 py-1.5 text-sm";

export default function RegistrationForm() {
  const [p, setP] = useState({ first_name: "", last_name: "", email: "", website: "" });
  const [sel, setSel] = useState<Partial<Record<Category, Entry>>>({});
  const [state, setState] = useState<"idle" | "sending" | "done">("idle");
  const [error, setError] = useState("");
  const [open, setOpen] = useState<Category | null>(null);
  const [optin, setOptin] = useState(true);
  const [notice, setNotice] = useState("");

  const missing = (c: Category, e: Entry) =>
    !e.chassis_brand.trim() || !e.engine_brand.trim() || !e.tire_brand.trim() || (!isNitro(c) && !e.esc_brand.trim());

  const toggle = (c: Category) => {
    if (sel[c]) {
      setSel((s) => { const n = { ...s }; delete n[c]; return n; });
      setOpen((o) => (o === c ? null : o));
      setNotice("");
    } else {
      const others = exclusiveWith(c).filter((x) => sel[x]);
      setSel((s) => {
        const n = { ...s, [c]: { ...empty } };
        for (const x of others) delete n[x]; // categorías excluyentes: queda solo la elegida
        return n;
      });
      setNotice(others.length ? `${c} y ${others.join(", ")} son excluyentes: se quitó ${others.join(", ")}.` : "");
      setOpen(c); // se abre la que se está completando y se pliegan las demás
    }
  };
  const upd = (c: Category, k: keyof Entry, v: string) =>
    setSel((s) => ({ ...s, [c]: { ...s[c]!, [k]: v } }));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const entries = CATEGORIES.filter((c) => sel[c]).map((c) => ({ category: c, ...sel[c]! }));
    for (const en of entries)
      if (missing(en.category, en)) {
        setOpen(en.category);
        return setError(`Completá chasis, motor${isNitro(en.category) ? "" : ", variador"} y gomas en ${en.category}`);
      }
    setState("sending");
    const r = await fetch("/api/register", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...p, email_optin: optin, entries }),
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
    <form onSubmit={submit} className="space-y-4 px-4 pb-4">
      <section className="grid grid-cols-3 gap-2">
        {([["first_name", "Nombre *"], ["last_name", "Apellido *"], ["email", "Email *"]] as const).map(([k, l]) => (
          <label key={k} className="text-xs font-semibold">
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
        <p className="text-xs text-white/70">Touring Eco Modified y Touring Eco Stock son excluyentes: elegí solo una.</p>
        <div className="mt-2 grid gap-2 sm:grid-cols-2">
          {CATEGORIES.map((c) => (
            <label key={c} className={`flex cursor-pointer items-center gap-3 rounded-lg border-2 p-3 font-bold ${sel[c] ? "border-sky-400 bg-sky-500/20" : "border-white/10"}`}>
              <input type="checkbox" checked={!!sel[c]} onChange={() => toggle(c)} className="h-5 w-5" />
              {c}
            </label>
          ))}
        </div>
        {notice && <p role="status" className="mt-2 rounded-lg bg-amber-500/20 p-2 text-sm text-amber-100">{notice}</p>}
      </section>

      {CATEGORIES.filter((c) => sel[c]).map((c) => {
        const isOpen = open === c;
        const done = !missing(c, sel[c]!);
        return (
          <section key={c} className="rounded-xl border border-white/15 bg-white/5">
            <button
              type="button" aria-expanded={isOpen} onClick={() => setOpen(isOpen ? null : c)}
              className="flex w-full items-center justify-between gap-2 px-3 py-2 text-left"
            >
              <span className="text-lg font-black leading-tight text-sky-300">{c}</span>
              <span className="flex items-center gap-2 text-xs font-semibold">
                <span className={done ? "text-emerald-300" : "text-amber-300"}>{done ? "✓ Completa" : "Falta completar"}</span>
                <span aria-hidden>{isOpen ? "▲" : "▼"}</span>
              </span>
            </button>
            {/* hidden (no desmontado) para conservar lo elegido, incluido "OTRA" */}
            <div hidden={!isOpen} className="px-3 pb-3">
              <label className="block text-sm font-semibold">
                Nº de transponder (opcional)
                <input className={input} value={sel[c]!.transponder} onChange={(e) => upd(c, "transponder", e.target.value)} />
              </label>
              <BrandPicker kind="chassis" value={sel[c]!.chassis_brand} onChange={(v) => upd(c, "chassis_brand", v)} />
              <BrandPicker kind={isNitro(c) ? "engine_nitro" : "engine_eco"} value={sel[c]!.engine_brand} onChange={(v) => upd(c, "engine_brand", v)} />
              {!isNitro(c) && <BrandPicker kind="esc" value={sel[c]!.esc_brand} onChange={(v) => upd(c, "esc_brand", v)} />}
              <BrandPicker kind={isGT(c) ? "tires_gt" : "tires"} value={sel[c]!.tire_brand} onChange={(v) => upd(c, "tire_brand", v)} />
            </div>
          </section>
        );
      })}

      <label className="flex cursor-pointer items-start gap-3 text-sm">
        <input type="checkbox" checked={optin} onChange={(e) => setOptin(e.target.checked)} className="mt-0.5 h-5 w-5 shrink-0" />
        <span>Acepto recibir avisos por mail sobre mi inscripción y el evento.</span>
      </label>

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
