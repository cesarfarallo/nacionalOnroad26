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
