const esc = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

export type PaymentMail = { to: string; name: string; categories: string[] };

/** Envía la confirmación de pago vía la API de Brevo. Lanza Error si falta configuración o falla el envío. */
export async function sendPaymentConfirmation({ to, name, categories }: PaymentMail) {
  const apiKey = process.env.BREVO_API_KEY?.trim();
  const fromEmail = process.env.MAIL_FROM_EMAIL?.trim();
  const fromName = process.env.MAIL_FROM_NAME?.trim() || "AAPARTT Nacional Onroad";
  if (!apiKey || !fromEmail) throw new Error("Faltan BREVO_API_KEY / MAIL_FROM_EMAIL");

  const cats = categories.join(", ");
  const text =
    `Hola ${name}:\n\n` +
    `Recibimos y verificamos tu pago. ¡Tu inscripción al AAPARTT Nacional Onroad está confirmada!\n\n` +
    `Categorías: ${cats}\n` +
    `Fechas: 20, 21 y 22 de noviembre\n` +
    `Lugar: Circuito Hernán Maticoli, Buenos Aires\n\n` +
    `Cualquier duda, consultá por WhatsApp al 11 5489-1392.\n\n¡Nos vemos en la pista!`;
  const html =
    `<div style="font-family:Arial,sans-serif;max-width:520px;margin:auto;color:#111">` +
    `<h2 style="color:#0b6fd6;margin-bottom:4px">¡Pago confirmado!</h2>` +
    `<p>Hola <strong>${esc(name)}</strong>:</p>` +
    `<p>Recibimos y verificamos tu pago. Tu inscripción al <strong>AAPARTT Nacional Onroad</strong> está confirmada.</p>` +
    `<ul><li><strong>Categorías:</strong> ${esc(cats)}</li>` +
    `<li><strong>Fechas:</strong> 20, 21 y 22 de noviembre</li>` +
    `<li><strong>Lugar:</strong> Circuito Hernán Maticoli, Buenos Aires</li></ul>` +
    `<p>Cualquier duda, consultá por WhatsApp al <a href="https://wa.me/5491154891392">11 5489-1392</a>.</p>` +
    `<p>¡Nos vemos en la pista!</p></div>`;

  const res = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: { "api-key": apiKey, "content-type": "application/json", accept: "application/json" },
    body: JSON.stringify({
      sender: { name: fromName, email: fromEmail },
      to: [{ email: to, name }],
      subject: "Pago confirmado – AAPARTT Nacional Onroad",
      htmlContent: html,
      textContent: text,
    }),
  });
  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`Brevo ${res.status}: ${detail.slice(0, 200)}`);
  }
}
