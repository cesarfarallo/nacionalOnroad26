# Deploy (Supabase + Vercel, sin costo)

Dos entornos: **dev** (rama `dev`) y **prod** (rama `main`), cada uno con su proyecto Supabase.

## 1. Supabase (repetir en el proyecto dev y en el prod)
1. SQL Editor → pegar el contenido de `supabase/schema.sql` → Run.
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

3. Deploy. Cada push a `dev` genera un preview con la DB dev; el merge `dev → main` actualiza producción con la DB prod.

## 3. Desarrollo local
`cp .env.example .env.local`, completar con las claves de **dev** y correr `npm run dev`.

## 4. Verificar
Inscribirse en la URL de preview, comprobar la fila en Table Editor (proyecto dev), entrar a `/admin` con `ADMIN_PASSWORD` y descargar CSV e imagen.
