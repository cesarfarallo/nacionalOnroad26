"use client";
import { useEffect, useRef, useState } from "react";
import { CATEGORIES } from "@/lib/categories";
import type { Row } from "@/lib/csv";
import { drawPoster } from "@/lib/poster";

export default function Admin() {
  const [rows, setRows] = useState<Row[] | null>(null);
  const [pw, setPw] = useState("");
  const [msg, setMsg] = useState("");
  const [date, setDate] = useState("Sábado 3 de octubre");
  const canvas = useRef<HTMLCanvasElement>(null);
  const [cats, setCats] = useState<string[]>(["GT Eco", "1/8 SP"]);

  async function load() {
    const r = await fetch("/api/admin/registrations");
    if (r.ok) setRows((await r.json()).rows);
    else if (r.status !== 401) setMsg((await r.json().catch(() => null))?.error ?? "Error al cargar");
  }
  useEffect(() => { load(); }, []);
  useEffect(() => { if (rows && canvas.current) drawPoster(canvas.current, cats, rows, date); }, [rows, cats, date]);

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
        <a href="/api/admin/export" className="rounded-lg bg-emerald-500 px-4 py-2 font-bold">Descargar CSV (GenericImport)</a>
        <button onClick={load} className="rounded-lg bg-white/10 px-4 py-2">Actualizar</button>
      </div>
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
        <input value={date} onChange={(e) => setDate(e.target.value)} className="w-full max-w-sm rounded-lg border border-white/20 bg-black/40 px-3 py-2" aria-label="Fecha" />
        <div><button onClick={download} className="rounded-lg bg-orange-500 px-4 py-2 font-bold">Descargar PNG</button></div>
        <canvas ref={canvas} className="w-full max-w-md rounded-lg border border-white/10" />
      </section>
    </main>
  );
}
