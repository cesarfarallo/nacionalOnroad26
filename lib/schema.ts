import { z } from "zod";
import { CATEGORIES } from "./categories";

const brand = z.string().trim().min(1, "Elegí una marca").max(60);

export const entrySchema = z.object({
  category: z.enum(CATEGORIES),
  transponder: z.string().trim().max(30).optional().default(""),
  chassis_brand: brand,
  engine_brand: brand,
  tire_brand: brand,
});

export const registerSchema = z.object({
  first_name: z.string().trim().min(1, "Requerido").max(60),
  last_name: z.string().trim().min(1, "Requerido").max(60),
  nickname: z.string().trim().max(60).optional().default(""),
  email: z.string().trim().email("Email inválido").max(120),
  phone: z.string().trim().max(30).optional().default(""),
  club: z.string().trim().max(80).optional().default(""),
  website: z.string().max(0).optional(), // honeypot
  entries: z
    .array(entrySchema)
    .min(1, "Elegí al menos una categoría")
    .refine((e) => new Set(e.map((x) => x.category)).size === e.length, "Categoría repetida"),
});
export type RegisterInput = z.infer<typeof registerSchema>;
