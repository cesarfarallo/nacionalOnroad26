"use client";
import { useState } from "react";
import { BRANDS, KIND_LABEL, type BrandKind } from "@/lib/brands";
import { OTHER } from "@/lib/categories";

export default function BrandPicker({
  kind, value, onChange,
}: { kind: BrandKind; value: string; onChange: (v: string) => void }) {
  const known = BRANDS[kind].some((b) => b.name === value);
  const [other, setOther] = useState(!!value && !known);
  return (
    <fieldset className="mt-3">
      <legend className="text-sm font-semibold text-sky-300">{KIND_LABEL[kind]}</legend>
      <div className="mt-2 grid grid-cols-3 gap-2 sm:grid-cols-4">
        {[...BRANDS[kind], { name: OTHER, image: undefined }].map((b) => {
          const selected = b.name === OTHER ? other : !other && value === b.name;
          return (
            <button
              type="button" key={b.name} aria-pressed={selected}
              onClick={() => { if (b.name === OTHER) { setOther(true); onChange(""); } else { setOther(false); onChange(b.name); } }}
              className={`flex h-16 items-center justify-center rounded-lg border-2 bg-white/5 p-1 text-sm font-bold transition ${selected ? "border-sky-400 bg-sky-500/20" : "border-white/10 hover:border-white/40"}`}
            >
              {b.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={b.image} alt={b.name} className="max-h-full max-w-full object-contain" />
              ) : b.name}
            </button>
          );
        })}
      </div>
      {other && (
        <input
          autoFocus value={value} onChange={(e) => onChange(e.target.value)} maxLength={60}
          placeholder="Escribí la marca" aria-label={`${KIND_LABEL[kind]} (otra)`}
          className="mt-2 w-full rounded-lg border border-white/20 bg-black/40 px-3 py-2"
        />
      )}
    </fieldset>
  );
}
