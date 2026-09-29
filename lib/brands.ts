// Catálogo único: cada marca y su logo (public/brands/<id>.png) se declaran una sola vez.
// Las listas de abajo solo dicen qué marcas aparecen en cada selector.
// Sin `image` se muestra un mosaico de texto.
export type Brand = { name: string; image?: string };
export type BrandKind = "chassis" | "engine_nitro" | "engine_eco" | "esc" | "tires";

const b = (name: string, file?: string): Brand => ({ name, image: file ? `/brands/${file}.png` : undefined });

const CATALOG = {
  xray: b("Xray", "xray"), mugen: b("Mugen", "mugen"), serpent: b("Serpent", "serpent"),
  shepherd: b("Shepherd", "shepherd"), associated: b("Team Associated", "team-associated"),
  losi: b("Losi", "losi"), threeRacing: b("3Racing", "3racing"), awesomatix: b("Awesomatix", "awesomatix"),
  kyosho: b("Kyosho", "kyosho"), tamiya: b("Tamiya", "tamiya"), yokomo: b("Yokomo", "yokomo"),
  schumacher: b("Schumacher", "schumacher"),
  novarossi: b("Novarossi", "novarossi"), picco: b("Picco", "picco"), sirio: b("Sirio", "sirio"),
  osSpeed: b("O.S. Speed", "os-speed"), reds: b("REDS", "reds"), orion: b("Team Orion", "team-orion"),
  nova: b("Nova Engines", "nova-engines"), rapide: b("Rapide"), syncro: b("Syncro"), gimar: b("Gi-Mar", "gimar"),
  hobbywing: b("Hobbywing", "hobbywing"), orca: b("Orca", "orca"), reedy: b("Reedy", "reedy"), lrp: b("LRP", "lrp"),
  trinity: b("Trinity"), teamPowers: b("Team Powers"), muchmore: b("Muchmore"),
  speedPassion: b("Speed Passion"), tekin: b("Tekin"), novak: b("Novak"), acuvance: b("Acuvance"),
  cayote: b("Cayote"), ruddog: b("Ruddog"),
  sweep: b("Sweep"), pitShop: b("Pit Shop"), jaco: b("Jaco"), gravity: b("Gravity"), moment: b("Moment"),
};
type Id = keyof typeof CATALOG;

const ecoBrands: Id[] = [
  "hobbywing", "orca", "trinity", "teamPowers", "muchmore", "speedPassion",
  "reedy", "orion", "lrp", "tekin", "novak", "acuvance", "cayote",
];

const LISTS: Record<BrandKind, Id[]> = {
  chassis: [
    "xray", "mugen", "serpent", "shepherd", "associated", "losi", "threeRacing",
    "awesomatix", "kyosho", "tamiya", "yokomo", "schumacher",
  ],
  engine_nitro: [
    "novarossi", "picco", "sirio", "osSpeed", "reds", "orion", "nova", "rapide", "syncro", "gimar",
  ],
  engine_eco: ecoBrands,
  esc: [...ecoBrands, "ruddog"],
  tires: ["sweep", "pitShop", "jaco", "gravity", "moment"],
};

export const BRANDS = Object.fromEntries(
  Object.entries(LISTS).map(([k, ids]) => [k, ids.map((id) => CATALOG[id])]),
) as Record<BrandKind, Brand[]>;

export const KIND_LABEL: Record<BrandKind, string> = {
  chassis: "Marca de chasis",
  engine_nitro: "Marca de motor nitro",
  engine_eco: "Marca de motor",
  esc: "Marca de variador (controladora)",
  tires: "Marca de gomas",
};
