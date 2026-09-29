import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth";
import { fetchRows } from "@/lib/fetchRows";

export async function GET() {
  if (!(await isAdmin())) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  try {
    return NextResponse.json({ rows: await fetchRows() });
  } catch {
    return NextResponse.json({ error: "Error de base de datos" }, { status: 500 });
  }
}
