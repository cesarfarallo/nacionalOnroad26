import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth";
import { db } from "@/lib/supabase";
import { sendPaymentConfirmation } from "@/lib/mail";

type EmailStatus = "sent" | "no_optin" | "already_sent" | "not_requested" | "failed";

export async function POST(req: Request) {
  if (!(await isAdmin())) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  const body = await req.json().catch(() => null);
  const id = body?.registrationId;
  if (typeof id !== "string" || typeof body?.paid !== "boolean")
    return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });
  const paid: boolean = body.paid;
  const sendEmail = paid && body.sendEmail === true;

  const sb = db();
  const { data: reg, error } = await sb
    .from("registrations")
    .select("id,first_name,last_name,email,email_optin,payment_email_sent_at")
    .eq("id", id)
    .single();
  if (error || !reg) return NextResponse.json({ error: "Inscripción no encontrada" }, { status: 404 });

  const { error: upErr } = await sb
    .from("registrations")
    .update({ paid, paid_at: paid ? new Date().toISOString() : null })
    .eq("id", id);
  if (upErr) return NextResponse.json({ error: `No se pudo guardar: ${upErr.message}` }, { status: 500 });

  let email: EmailStatus = "not_requested";
  let emailError: string | undefined;
  if (sendEmail) {
    if (!reg.email_optin) email = "no_optin";
    else if (reg.payment_email_sent_at) email = "already_sent";
    else {
      try {
        const { data: entries } = await sb.from("entries").select("category").eq("registration_id", id);
        await sendPaymentConfirmation({
          to: reg.email,
          name: `${reg.first_name} ${reg.last_name}`.trim(),
          categories: (entries ?? []).map((e) => e.category),
        });
        await sb.from("registrations").update({ payment_email_sent_at: new Date().toISOString() }).eq("id", id);
        email = "sent";
      } catch (e) {
        console.error("payment mail:", e);
        email = "failed";
        emailError = e instanceof Error ? e.message : String(e);
      }
    }
  }
  return NextResponse.json({ ok: true, paid, email, emailError });
}
