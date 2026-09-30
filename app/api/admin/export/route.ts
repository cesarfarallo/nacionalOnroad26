import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth";
import { fetchRows } from "@/lib/fetchRows";
import { buildCsv, isDateMode } from "@/lib/csv";

export async function GET(req: Request) {
  if (!(await isAdmin())) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  const mode = new URL(req.url).searchParams.get("date");
  const csv = buildCsv(await fetchRows(), isDateMode(mode) ? mode : "dmy24");
  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="GenericImport.csv"',
    },
  });
}
