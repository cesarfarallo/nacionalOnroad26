import { createClient } from "@supabase/supabase-js";

export function db() {
  const raw = process.env.SUPABASE_URL?.trim();
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!raw || !key) throw new Error("Faltan SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY");
  // Solo el origen (https://xxxx.supabase.co): ignora barras finales o rutas como /rest/v1.
  let url: string;
  try {
    url = new URL(/^https?:\/\//i.test(raw) ? raw : `https://${raw}`).origin;
  } catch {
    throw new Error("SUPABASE_URL inválida: debe ser algo como https://xxxx.supabase.co");
  }
  return createClient(url, key, { auth: { persistSession: false } });
}
