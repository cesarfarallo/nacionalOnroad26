import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth";
import { fetchRows } from "@/lib/fetchRows";

export async function GET() {
  if (!(await isAdmin())) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  try {
    return NextResponse.json({ rows: await fetchRows() });
  } catch (e) {
    const detail = e instanceof Error ? e.message : (e as { message?: string })?.message ?? String(e);
    console.error("admin/registrations:", e);
    return NextResponse.json({ error: `Error de base de datos: ${detail}` }, { status: 500 });
  }
}
