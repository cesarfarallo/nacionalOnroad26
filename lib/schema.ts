import { z } from "zod";
import { CATEGORIES, EXCLUSIVE_GROUPS, isNitro } from "./categories";

const brand = z.string().trim().min(1, "Elegí una marca").max(60);

export const entrySchema = z.object({
  category: z.enum(CATEGORIES),
  transponder: z.string().trim().max(30).optional().default(""),
  chassis_brand: brand,
  engine_brand: brand,
  esc_brand: z.string().trim().max(60).optional().default(""),
  tire_brand: brand,
}).refine((e) => isNitro(e.category) || e.esc_brand.length > 0, {
  message: "Elegí la marca de variador",
  path: ["esc_brand"],
});

export const registerSchema = z.object({
  first_name: z.string().trim().min(1, "Requerido").max(60),
  last_name: z.string().trim().min(1, "Requerido").max(60),
  nickname: z.string().trim().max(60).optional().default(""),
  email: z.string().trim().email("Email inválido").max(120),
  phone: z.string().trim().max(30).optional().default(""),
  club: z.string().trim().max(80).optional().default(""),
  email_optin: z.boolean().optional().default(false),
  website: z.string().max(0).optional(), // honeypot
  entries: z
    .array(entrySchema)
    .min(1, "Elegí al menos una categoría")
    .refine((e) => new Set(e.map((x) => x.category)).size === e.length, "Categoría repetida")
    .refine(
      (e) => EXCLUSIVE_GROUPS.every((g) => e.filter((x) => g.includes(x.category)).length <= 1),
      "Touring Eco Modified y Touring Eco Stock son excluyentes: elegí solo una",
    ),
});
export type RegisterInput = z.infer<typeof registerSchema>;
