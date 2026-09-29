export const CATEGORIES = [
  "1/8 SP",
  "GT Eco",
  "GT Nitro",
  "Touring Eco Modified",
  "Touring Eco Stock",
] as const;
export type Category = (typeof CATEGORIES)[number];
export const OTHER = "OTRA";
