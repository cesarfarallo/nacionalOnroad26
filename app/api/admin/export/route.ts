import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth";
import { fetchRows } from "@/lib/fetchRows";
import { buildCsv } from "@/lib/csv";

export async function GET() {
  if (!(await isAdmin())) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  const csv = buildCsv(await fetchRows());
  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="GenericImport.csv"',
    },
  });
}
