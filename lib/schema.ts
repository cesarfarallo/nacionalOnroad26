import { z } from "zod";
import { CATEGORIES, EXCLUSIVE_GROUPS, isNitro } from "./categories";

const brand = z.string().trim().min(1, "Elegí una marca").max(60);

const entryFields = {
  category: z.enum(CATEGORIES),
  transponder: z.string().trim().max(30).optional().default(""),
  chassis_brand: brand,
  engine_brand: brand,
  esc_brand: z.string().trim().max(60).optional().default(""),
  tire_brand: brand,
};
const escOk = (e: { category: (typeof CATEGORIES)[number]; esc_brand: string }) => isNitro(e.category) || e.esc_brand.length > 0;
const escMsg = { message: "Elegí la marca de variador", path: ["esc_brand"] };

export const entrySchema = z.object(entryFields).refine(escOk, escMsg);
const entriesRules = <T extends z.ZodTypeAny>(item: T) =>
  z
    .array(item)
    .min(1, "Elegí al menos una categoría")
    .refine((e: { category: string }[]) => new Set(e.map((x) => x.category)).size === e.length, "Categoría repetida")
    .refine(
      (e: { category: string }[]) => EXCLUSIVE_GROUPS.every((g) => e.filter((x) => (g as readonly string[]).includes(x.category)).length <= 1),
      "Touring Eco Modified y Touring Eco Stock son excluyentes: elegí solo una",
    );

const personFields = {
  first_name: z.string().trim().min(1, "Falta el nombre").max(60),
  last_name: z.string().trim().min(1, "Falta el apellido").max(60),
  nickname: z.string().trim().max(60).optional().default(""),
  email: z.string().trim().email("Email inválido").max(120),
  phone: z.string().trim().max(30).optional().default(""),
  club: z.string().trim().max(80).optional().default(""),
  email_optin: z.boolean().optional().default(false),
};

export const registerSchema = z.object({
  ...personFields,
  website: z.string().max(0).optional(), // honeypot
  entries: entriesRules(entrySchema),
});
export type RegisterInput = z.infer<typeof registerSchema>;

/** Edición de una inscripción desde el panel de administrador (datos del piloto + todas sus categorías). */
export const updateSchema = z.object({
  registrationId: z.string().uuid(),
  ...personFields,
  entries: entriesRules(z.object({ id: z.string().uuid().optional(), ...entryFields }).refine(escOk, escMsg)),
});
export type UpdateInput = z.infer<typeof updateSchema>;
