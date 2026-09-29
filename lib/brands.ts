// Agregar marcas: poner el logo en public/brands/<tipo>/ y sumarlo acá con `image`.
// Sin `image` se muestra un tile de texto.
export type Brand = { name: string; image?: string };
export type BrandKind = "chassis" | "engine_nitro" | "engine_eco" | "tires";

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
    { name: "Kyosho", image: "/brands/chassis/kyosho.png" },
    { name: "Tamiya", image: "/brands/chassis/tamiya.png" },
    { name: "Yokomo", image: "/brands/chassis/yokomo.png" },
    { name: "Schumacher", image: "/brands/chassis/schumacher.png" },
  ],
  engine_nitro: [
    { name: "Novarossi", image: "/brands/engine/novarossi.png" }, { name: "Picco", image: "/brands/engine/picco.png" }, { name: "Sirio", image: "/brands/engine/sirio.png" }, { name: "O.S. Speed", image: "/brands/engine/os-speed.png" },
    { name: "REDS" }, { name: "Team Orion" }, { name: "Nova Engines" }, { name: "Rapide" },
    { name: "Syncro" }, { name: "Gi-Mar", image: "/brands/engine/gimar.png" },
  ],
  // Eco: motor + variador van en combo, se elige la marca del combo.
  engine_eco: [
    { name: "Hobbywing" }, { name: "Orca" }, { name: "Trinity" }, { name: "Team Powers" },
    { name: "Muchmore" },
  ],
  tires: [
    { name: "Sweep" }, { name: "Pit Shop" }, { name: "Jaco" }, { name: "Gravity" },
    { name: "Moment" },
  ],
};
export const KIND_LABEL: Record<BrandKind, string> = {
  chassis: "Marca de chasis",
  engine_nitro: "Marca de motor nitro",
  engine_eco: "Marca de motor / variador (combo)",
  tires: "Marca de gomas",
};
