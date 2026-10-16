import { db } from "./supabase";
import type { Row } from "./csv";

export async function fetchRows(): Promise<Row[]> {
  const { data, error } = await db()
    .from("entries")
    .select("id,registration_id,category,transponder,chassis_brand,engine_brand,esc_brand,tire_brand,registrations(first_name,last_name,nickname,email,phone,club,created_at,email_optin,paid)")
    .order("category");
  if (error) throw error;
  return (data as any[])
    .map(({ id, ...e }) => ({ ...e.registrations, ...e, entry_id: id, registrations: undefined }) as Row)
    .sort((a, b) => a.created_at.localeCompare(b.created_at));
}
