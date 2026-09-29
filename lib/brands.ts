// Agregar marcas: poner el logo en public/brands/<tipo>/ y sumarlo acá con `image`.
// Sin `image` se muestra un tile de texto.
export type Brand = { name: string; image?: string };
export type BrandKind = "chassis" | "engine" | "tires";

export const BRANDS: Record<BrandKind, Brand[]> = {
  chassis: [
    { name: "Xray", image: "/brands/chassis/xray.png" },
    { name: "Mugen", image: "/brands/chassis/mugen.png" },
    { name: "Serpent", image: "/brands/chassis/serpent.png" },
    { name: "Shepherd", image: "/brands/chassis/shepherd.png" },
    { name: "Team Associated", image: "/brands/chassis/team-associated.png" },
    { name: "Losi", image: "/brands/chassis/losi.png" },
    { name: "3Racing", image: "/brands/chassis/3racing.png" },
    { name: "Awesomatix", image: "/brands/chassis/awesomatix.png" },
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
