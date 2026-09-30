# Deploy (Supabase + Vercel, sin costo)

Dos entornos: **dev** (rama `dev`) y **prod** (rama `main`), cada uno con su proyecto Supabase.

## 1. Supabase (repetir en el proyecto dev y en el prod)
1. SQL Editor → pegar el contenido de `supabase/schema.sql` → Run. (Es idempotente: si ya lo corriste antes, volvé a correrlo para sumar las columnas nuevas de pagos y opt-in.)
2. Project Settings → API: copiar **Project URL** y la key **service_role** (secreta, no compartir ni commitear).

## 2. Vercel
1. Add New → Project → importar `cesarfarallo/nacionalOnroad26`. Production Branch = `main`.
2. Settings → Environment Variables. Cargar las 4 variables:

| Variable | Production (prod) | Preview (dev) |
|---|---|---|
| `SUPABASE_URL` | URL del proyecto prod | URL del proyecto dev |
| `SUPABASE_SERVICE_ROLE_KEY` | service_role prod | service_role dev |
| `ADMIN_PASSWORD` | clave de admin prod | clave de admin dev |
| `SESSION_SECRET` | `openssl rand -hex 32` | otro distinto |
| `BREVO_API_KEY` | API key v3 de Brevo | la misma o otra |
| `MAIL_FROM_EMAIL` | casilla remitente verificada en Brevo | la misma |
| `MAIL_FROM_NAME` | `AAPARTT Nacional Onroad` | igual |

3. Deploy. Cada push a `dev` genera un preview con la DB dev; el merge `dev → main` actualiza producción con la DB prod.

## 3. Mails de confirmación de pago (Brevo, plan gratis)
1. Crear cuenta en brevo.com.
2. **Senders, domains & dedicated IPs → Senders → Add a sender**: cargar la casilla desde la que van a salir los mails y verificarla (llega un mail de verificación).
3. **SMTP & API → API Keys → Generate a new API key**: copiar la key (se muestra una sola vez).
4. Cargar `BREVO_API_KEY`, `MAIL_FROM_EMAIL` y `MAIL_FROM_NAME` en Vercel y hacer **Redeploy**.

En `/admin`, la sección **Pagos** tiene un tilde por piloto. Al tildarlo pide confirmación y, si el piloto aceptó recibir mails, le envía la confirmación de pago (una sola vez). Si no aceptó, solo marca el pago. El plan gratis de Brevo agrega un pie "enviado con Brevo" y permite 300 mails por día.

## 4. Desarrollo local
`cp .env.example .env.local`, completar con las claves de **dev** y correr `npm run dev`.

## 5. Verificar
Inscribirse en la URL de preview, comprobar la fila en Table Editor (proyecto dev), entrar a `/admin` con `ADMIN_PASSWORD` y descargar CSV e imagen.

## Importar a LiveTime (GenericImport.csv)
El botón **Descargar CSV (GenericImport)** de `/admin` genera el archivo según la *LiveTime Import and Export Guide* (edición RC):

- **Sale en el CSV:** nombre, apellido, clase (`ClassName`), pagado (`IsPaid`), fecha de inscripción (`M/d/yyyy hh:mm:ss AM|PM`, hora de Argentina), chasis (`ChassisManufacturer`, con el nombre exacto de la lista de LiveTime), transponder (solo si es un número) y email.
- **No sale (queda en la base y en el panel):** marca de motor, variador y marca de gomas, porque el import no tiene un campo equivalente (`Manufacturer` es de otras ediciones, `TireNumber` es un código de 4 caracteres y `ModelName` es el modelo del vehículo). Un chasis que no figura en la lista de LiveTime (por ejemplo uno cargado con "OTRA") sale vacío; el panel avisa cuántos son.
- Las clases del evento en LiveTime tienen que llamarse exactamente `1/8 SP`, `GT Eco`, `GT Nitro`, `Touring Eco Modified` y `Touring Eco Stock`.
- Antes de importar, hacé un **backup** de la base de LiveTime (el import no se puede deshacer) y probá primero con **una sola fila**.
