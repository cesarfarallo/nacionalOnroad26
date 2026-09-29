"use client";
import { useState } from "react";

const ALIAS = "DEMART.MP";

const PLANS = [
  {
    title: "Con descuento",
    note: "Hasta el 4 de noviembre",
    highlight: true,
    prices: [["1 categoría", "$100.000"], ["2 o más categorías", "$150.000"]],
  },
  {
    title: "Sin descuento",
    note: "Desde el 5 de noviembre",
    highlight: false,
    prices: [["1 categoría", "$130.000"], ["2 o más categorías", "$195.000"]],
  },
] as const;

export default function PricingInfo() {
  const [copied, setCopied] = useState(false);
  async function copy() {
    try {
      await navigator.clipboard.writeText(ALIAS);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* sin permisos de portapapeles: el alias queda visible para copiarlo a mano */
    }
  }

  return (
    <section aria-labelledby="precios" className="mx-4 my-3 rounded-xl border border-sky-400/40 bg-sky-500/10 p-3">
      <h2 id="precios" className="text-center text-lg font-black uppercase tracking-wide">Costo de inscripción</h2>
      <p className="mt-1 text-center text-sm text-sky-100">
        ¡Inscribite antes del <strong>5 de noviembre</strong> y accedé al precio con descuento!
      </p>

      <div className="mt-3 grid grid-cols-2 gap-2">
        {PLANS.map((p) => (
          <div
            key={p.title}
            className={`rounded-lg border p-2 text-center ${p.highlight ? "border-emerald-400/60 bg-emerald-500/10" : "border-white/15 bg-white/5"}`}
          >
            <h3 className={`text-sm font-black uppercase ${p.highlight ? "text-emerald-300" : "text-white/80"}`}>{p.title}</h3>
            <p className="text-[11px] text-white/60">{p.note}</p>
            <dl className="mt-1 space-y-1">
              {p.prices.map(([label, price]) => (
                <div key={label}>
                  <dt className="text-xs text-white/70">{label}</dt>
                  <dd className="text-lg font-black leading-tight">{price}</dd>
                </div>
              ))}
            </dl>
          </div>
        ))}
      </div>

      <div className="mt-3 flex flex-wrap items-center justify-center gap-2 text-sm">
        <span>Pago por transferencia al alias:</span>
        <button
          type="button" onClick={copy}
          className="rounded-md border border-white/30 bg-black/40 px-2 py-0.5 font-mono font-bold hover:border-sky-300"
          aria-label={`Copiar alias ${ALIAS}`}
        >
          {ALIAS} <span className="ml-1 text-xs font-sans font-semibold text-sky-300">{copied ? "¡Copiado!" : "Copiar"}</span>
        </button>
      </div>
      <p className="mt-2 text-center text-xs text-white/70">
        Una vez verificado el pago, te enviaremos la confirmación por mail.
      </p>
      <p className="mt-2 border-t border-white/10 pt-2 text-center text-sm">
        Cualquier duda, consultá por WhatsApp al{" "}
        <a
          href="https://wa.me/5491154891392" target="_blank" rel="noopener noreferrer"
          className="whitespace-nowrap font-bold text-emerald-300 underline underline-offset-2"
        >
          11 5489-1392
        </a>
        .
      </p>
    </section>
  );
}
