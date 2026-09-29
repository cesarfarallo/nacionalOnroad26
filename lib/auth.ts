import { createHmac, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";

const COOKIE = "admin_session";
const secret = () => process.env.SESSION_SECRET || "";
const sign = (v: string) => createHmac("sha256", secret()).update(v).digest("hex");

export function safeEqual(a: string, b: string) {
  const ha = createHmac("sha256", "x").update(a).digest();
  const hb = createHmac("sha256", "x").update(b).digest();
  return timingSafeEqual(ha, hb);
}

export function makeToken() {
  const exp = String(Date.now() + 12 * 3600 * 1000);
  return `${exp}.${sign(exp)}`;
}

export async function isAdmin() {
  if (!secret()) return false;
  const t = (await cookies()).get(COOKIE)?.value;
  if (!t) return false;
  const [exp, sig] = t.split(".");
  if (!exp || !sig || Number(exp) < Date.now()) return false;
  return safeEqual(sig, sign(exp));
}
export const ADMIN_COOKIE = COOKIE;
