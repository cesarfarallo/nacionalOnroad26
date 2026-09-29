// Agregar marcas: poner el logo en public/brands/<tipo>/ y sumarlo acá con `image`.
// Sin `image` se muestra un tile de texto.
export type Brand = { name: string; image?: string };
export type BrandKind = "chassis" | "engine" | "tires";

export const BRANDS: Record<BrandKind, Brand[]> = {
  chassis: [
    { name: "Mugen" }, { name: "Xray" }, { name: "Serpent" }, { name: "Kyosho" },
    { name: "Tamiya" }, { name: "Team Associated" }, { name: "Yokomo" }, { name: "Schumacher" },
  ],
  engine: [
    { name: "Novarossi" }, { name: "Picco" }, { name: "Sirio" }, { name: "Hobbywing" },
    { name: "Orca" }, { name: "Trinity" },
  ],
  tires: [
    { name: "Sweep" }, { name: "Pit Shop" }, { name: "Jaco" }, { name: "Gravity" },
    { name: "Moment" },
  ],
};
export const KIND_LABEL: Record<BrandKind, string> = {
  chassis: "Marca de chasis",
  engine: "Marca de motor",
  tires: "Marca de gomas",
};
