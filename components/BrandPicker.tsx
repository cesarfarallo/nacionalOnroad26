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
    <fieldset className="mt-2">
      <legend className="text-xs font-semibold text-sky-300">{KIND_LABEL[kind]}</legend>
      <div className="mt-1 grid grid-cols-4 gap-1.5 sm:grid-cols-6">
        {[...BRANDS[kind], { name: OTHER, image: undefined }].map((b) => {
          const selected = b.name === OTHER ? other : !other && value === b.name;
          return (
            <button
              type="button" key={b.name} aria-pressed={selected}
              onClick={() => { if (b.name === OTHER) { setOther(true); onChange(""); } else { setOther(false); onChange(b.name); } }}
              className={`flex h-10 items-center justify-center rounded-md border-2 p-1 text-[11px] font-bold leading-tight transition ${b.image ? "bg-white" : "bg-white/5"} ${selected ? "border-sky-400 ring-2 ring-sky-400" : "border-white/10 hover:border-white/40"}`}
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
          className="mt-1.5 w-full rounded-md border border-white/20 bg-black/40 px-3 py-1.5 text-sm"
        />
      )}
    </fieldset>
  );
}
