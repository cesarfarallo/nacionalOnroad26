export const CATEGORIES = [
  "1/8 SP",
  "GT Eco",
  "GT Nitro",
  "Touring Eco Modified",
  "Touring Eco Stock",
] as const;
export type Category = (typeof CATEGORIES)[number];
export const OTHER = "OTRA";

export const isNitro = (c: Category) => c === "1/8 SP" || c === "GT Nitro";
export const isGT = (c: Category) => c === "GT Nitro" || c === "GT Eco";

/** Grupos de categorías excluyentes: en cada grupo el piloto se anota en una sola. */
export const EXCLUSIVE_GROUPS: readonly (readonly Category[])[] = [
  ["Touring Eco Modified", "Touring Eco Stock"],
];
/** Categorías del mismo grupo excluyente que `c` (sin incluirla). */
export const exclusiveWith = (c: Category): Category[] =>
  EXCLUSIVE_GROUPS.filter((g) => g.includes(c)).flatMap((g) => g.filter((x) => x !== c));
