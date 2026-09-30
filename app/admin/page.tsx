"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { CATEGORIES } from "@/lib/categories";
import { csvWarnings, DATE_MODES, isDateMode, type DateMode, type Row } from "@/lib/csv";
import { Oswald } from "next/font/google";
import { drawPoster } from "@/lib/poster";

const oswald = Oswald({ subsets: ["latin"], weight: ["500", "700"] });

export default function Admin() {
  const [rows, setRows] = useState<Row[] | null>(null);
  const [pw, setPw] = useState("");
  const [msg, setMsg] = useState("");
  const [date, setDate] = useState(() => `Actualizado al ${new Date().toLocaleDateString("es-AR")}`);
  const canvas = useRef<HTMLCanvasElement>(null);
  const [cats, setCats] = useState<string[]>(["GT Eco", "1/8 SP"]);

  async function load() {
    const r = await fetch("/api/admin/registrations");
    if (r.ok) setRows((await r.json()).rows);
    else if (r.status !== 401) setMsg((await r.json().catch(() => null))?.error ?? "Error al cargar");
  }
  useEffect(() => { load(); }, []);

  // Un piloto por inscripción (el pago es por piloto, no por categoría)
  const pilots = useMemo(() => {
    const m = new Map<string, { id: string; name: string; email: string; optin: boolean; paid: boolean; cats: string[] }>();
    for (const r of rows ?? []) {
      const p = m.get(r.registration_id) ?? {
        id: r.registration_id, name: `${r.first_name} ${r.last_name}`.trim(), email: r.email,
        optin: r.email_optin, paid: r.paid, cats: [],
      };
      p.cats.push(r.category);
      m.set(r.registration_id, p);
    }
    return [...m.values()];
  }, [rows]);
  const [dateMode, setDateMode] = useState<DateMode>("dmy24");
  useEffect(() => { try { const v = localStorage.getItem("csvDateMode"); if (isDateMode(v)) setDateMode(v); } catch { /* sin almacenamiento */ } }, []);
  const warn = useMemo(() => csvWarnings(rows ?? []), [rows]);
  const [busy, setBusy] = useState<string | null>(null);
  const [payMsg, setPayMsg] = useState("");

  async function removePilot(p: { id: string; name: string; paid: boolean; cats: string[] }) {
    if (p.paid) {
      const typed = window.prompt(
        `ATENCIÓN: ${p.name} figura como PAGADO.\n\nSi la eliminás, se pierde ese registro de pago y no se puede deshacer.\n\nPara confirmar, escribí ELIMINAR:`,
      );
      if (typed === null) return;
      if (typed.trim().toUpperCase() !== "ELIMINAR") { setPayMsg("No se eliminó: la palabra de confirmación no coincidía."); return; }
    } else if (!window.confirm(`¿Eliminar la inscripción de ${p.name} (${p.cats.join(", ")})?\n\nEsta acción no se puede deshacer.`)) return;
    setBusy(p.id); setPayMsg("");
    try {
      const r = await fetch("/api/admin/registrations", {
        method: "DELETE", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ registrationId: p.id }),
      });
      const j = await r.json().catch(() => ({}));
      setPayMsg(r.ok ? `Se eliminó la inscripción de ${p.name}.` : j.error ?? "No se pudo eliminar la inscripción");
      if (r.ok || r.status === 404) await load();
    } finally { setBusy(null); }
  }

  async function togglePaid(p: { id: string; name: string; email: string; optin: boolean; paid: boolean }) {
    const paid = !p.paid;
    const ask = !paid
      ? `¿Marcar como NO pagado a ${p.name}? No se enviará ningún mail.`
      : p.optin
        ? `¿Confirmás el pago de ${p.name}?\n\nSe enviará un mail de confirmación a ${p.email}.`
        : `¿Confirmás el pago de ${p.name}?\n\nNo aceptó recibir mails: se marcará como pagado sin enviar mail.`;
    if (!window.confirm(ask)) return;
    setBusy(p.id); setPayMsg("");
    try {
      const r = await fetch("/api/admin/payment", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ registrationId: p.id, paid, sendEmail: true }),
      });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) setPayMsg(j.error ?? "No se pudo guardar el pago");
      else setPayMsg(
        j.email === "sent" ? `Pago de ${p.name} confirmado y mail enviado a ${p.email}.`
        : j.email === "failed" ? `Pago de ${p.name} guardado, pero NO se pudo enviar el mail (${j.emailError ?? "error"}). Destildá y volvé a tildar para reintentar.`
        : j.email === "already_sent" ? `Pago de ${p.name} guardado. El mail ya se había enviado antes.`
        : j.email === "no_optin" ? `Pago de ${p.name} guardado (no aceptó recibir mails).`
        : paid ? `Pago de ${p.name} guardado.` : `${p.name} marcado como no pagado.`,
      );
      await load();
    } finally { setBusy(null); }
  }
  useEffect(() => {
    if (!rows || !canvas.current) return;
    let cancelled = false;
    const family = oswald.style.fontFamily;
    (async () => {
      try { await Promise.all([document.fonts.load(`700 30px ${family}`), document.fonts.load(`500 30px ${family}`)]); } catch { /* usa la fuente de respaldo */ }
      if (!cancelled) await drawPoster(canvas.current!, cats, rows, date, { fontFamily: family, isCancelled: () => cancelled });
    })();
    return () => { cancelled = true; };
  }, [rows, cats, date]);

  async function login(e: React.FormEvent) {
    e.preventDefault();
    const r = await fetch("/api/admin/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ password: pw }) });
    if (r.ok) { setMsg(""); load(); } else setMsg("Clave incorrecta");
  }
  const download = () => {
    const a = document.createElement("a");
    a.href = canvas.current!.toDataURL("image/png");
    a.download = `pre-inscripcion-${cats.join("-").replace(/[^\w-]/g, "")}.png`;
    a.click();
  };
  const toggleCat = (c: string) =>
    setCats((s) => (s.includes(c) ? s.filter((x) => x !== c) : s.length >= 2 ? [...s.slice(1), c] : [...s, c]));

  if (!rows)
    return (
      <form onSubmit={login} className="mx-auto mt-24 max-w-sm space-y-3 p-4">
        <h1 className="text-2xl font-black">Admin</h1>
        <input type="password" value={pw} onChange={(e) => setPw(e.target.value)} placeholder="Clave" className="w-full rounded-lg border border-white/20 bg-black/40 px-3 py-2" />
        <button className="w-full rounded-lg bg-sky-500 py-2 font-bold">Entrar</button>
        {msg && <p className="text-red-300">{msg}</p>}
      </form>
    );

  return (
    <main className="mx-auto max-w-5xl space-y-6 p-4">
      <h1 className="text-2xl font-black">Inscriptos ({rows.length} inscripciones)</h1>
      <div className="flex flex-wrap gap-3">
        <a href={`/api/admin/export?date=${dateMode}`} className="rounded-lg bg-emerald-500 px-4 py-2 font-bold">Descargar CSV (GenericImport)</a>
        <label className="flex items-center gap-2 text-sm">
          Formato de fecha
          <select value={dateMode} aria-label="Formato de fecha del CSV"
            onChange={(e) => { const v = e.target.value as DateMode; setDateMode(v); try { localStorage.setItem("csvDateMode", v); } catch { /* ignorar */ } }}
            className="rounded-lg border border-white/20 bg-black/40 px-2 py-2">
            {DATE_MODES.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
          </select>
        </label>
        <button onClick={load} className="rounded-lg bg-white/10 px-4 py-2">Actualizar</button>
      </div>
      {(warn.chassisNotInList > 0 || warn.transponderNotNumeric > 0) && (
        <ul role="note" className="space-y-1 rounded-lg bg-amber-500/15 p-3 text-sm text-amber-100">
          {warn.chassisNotInList > 0 && <li>{warn.chassisNotInList} inscripción(es) tienen un chasis que no figura en la lista de LiveTime: salen con el chasis vacío en el CSV (siguen guardadas acá).</li>}
          {warn.transponderNotNumeric > 0 && <li>{warn.transponderNotNumeric} inscripción(es) tienen un transponder que no es un número: salen vacías en el CSV.</li>}
        </ul>
      )}
      <section className="space-y-2">
        <h2 className="text-xl font-black">Pagos ({pilots.filter((p) => p.paid).length}/{pilots.length} pagaron)</h2>
        {payMsg && <p role="status" className="rounded-lg bg-white/10 p-2 text-sm">{payMsg}</p>}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead><tr className="text-sky-300">{["Pagó", "Piloto", "Email", "Categorías", "Acepta mails", ""].map((h) => <th key={h} className="p-2">{h}</th>)}</tr></thead>
            <tbody>
              {pilots.map((p) => (
                <tr key={p.id} className="border-t border-white/10">
                  <td className="p-2">
                    <input type="checkbox" className="h-5 w-5" checked={p.paid} disabled={busy === p.id}
                      onChange={() => togglePaid(p)} aria-label={`Pagó ${p.name}`} />
                  </td>
                  <td className="p-2">{p.name}</td><td className="p-2">{p.email}</td>
                  <td className="p-2">{p.cats.join(", ")}</td>
                  <td className="p-2">{p.optin ? "Sí" : "No"}</td>
                  <td className="p-2 text-right">
                    <button type="button" onClick={() => removePilot(p)} disabled={busy === p.id}
                      aria-label={`Eliminar la inscripción de ${p.name}`}
                      className="rounded-md border border-red-400/60 px-2 py-1 text-xs font-bold text-red-300 hover:bg-red-500/20 disabled:opacity-40">
                      Eliminar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
      <h2 className="text-xl font-black">Detalle por categoría</h2>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead><tr className="text-sky-300">{["Categoría", "Piloto", "Email", "Transp.", "Chasis", "Motor", "Variador", "Gomas"].map((h) => <th key={h} className="p-2">{h}</th>)}</tr></thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={i} className="border-t border-white/10">
                <td className="p-2">{r.category}</td><td className="p-2">{r.first_name} {r.last_name}</td>
                <td className="p-2">{r.email}</td><td className="p-2">{r.transponder}</td>
                <td className="p-2">{r.chassis_brand}</td><td className="p-2">{r.engine_brand}</td><td className="p-2">{r.esc_brand}</td><td className="p-2">{r.tire_brand}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <section className="space-y-3">
        <h2 className="text-xl font-black">Imagen de pre-inscriptos (elegí hasta 2 categorías)</h2>
        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map((c) => (
            <label key={c} className={`cursor-pointer rounded-lg border-2 px-3 py-1 ${cats.includes(c) ? "border-sky-400" : "border-white/10"}`}>
              <input type="checkbox" className="mr-2" checked={cats.includes(c)} onChange={() => toggleCat(c)} />{c}
            </label>
          ))}
        </div>
        <input value={date} onChange={(e) => setDate(e.target.value)} className="w-full max-w-sm rounded-lg border border-white/20 bg-black/40 px-3 py-2" aria-label="Línea de actualización" />
        <div><button onClick={download} className="rounded-lg bg-orange-500 px-4 py-2 font-bold">Descargar PNG</button></div>
        <canvas ref={canvas} className="w-full max-w-md rounded-lg border border-white/10" />
      </section>
    </main>
  );
}
