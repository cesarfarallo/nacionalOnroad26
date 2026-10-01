import type { Row } from "./csv";
import { brandImageByName } from "./brands";
import { isNitro, type Category } from "./categories";

const W = 1080;
const M = 40; // margen lateral
const BANNER_H = 470;
const TITLE_H = 130;
const LEGEND_H = 44; // renglón extra bajo el título cuando hay pilotos con pago confirmado
const PAID = "#22c55e";
const CAT_H = 66;
const HEAD_H = 46;
const ROW_H = 58;
const ROW_GAP = 6;
const BLOCK_GAP = 34;
const FOOTER_H = 80;

const ACCENT: Record<string, string> = {
  "GT Eco": "#ff8a00",
  "GT Nitro": "#ff2a2a",
  "1/8 SP": "#e01414",
  "Touring Eco Modified": "#1e90ff",
  "Touring Eco Stock": "#22c55e",
};

export const displayName = (r: Row) => `${r.first_name} ${r.last_name}`.trim().toUpperCase();

type ColKey = "chassis_brand" | "engine_brand" | "esc_brand" | "tire_brand";
type Col = { key: ColKey; label: string };
const columnsFor = (cat: string): Col[] =>
  isNitro(cat as Category)
    ? [{ key: "chassis_brand", label: "CHASIS" }, { key: "engine_brand", label: "MOTOR" }, { key: "tire_brand", label: "GOMAS" }]
    : [
        { key: "chassis_brand", label: "CHASIS" }, { key: "engine_brand", label: "MOTOR" },
        { key: "esc_brand", label: "VARIADOR" }, { key: "tire_brand", label: "GOMAS" },
      ];

const cache = new Map<string, Promise<HTMLImageElement | null>>();
function loadImage(src: string) {
  let p = cache.get(src);
  if (!p) {
    p = new Promise<HTMLImageElement | null>((resolve) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => resolve(null);
      img.src = src;
    });
    cache.set(src, p);
  }
  return p;
}

/** Billete verde (con "$" al centro), dibujado con formas: no depende de emojis ni de la tipografía. */
function paidBill(g: CanvasRenderingContext2D, cx: number, cy: number, w: number, family: string) {
  const h = w * 0.62, x = cx - w / 2, y = cy - h / 2;
  g.save();
  g.fillStyle = "#15803d"; g.beginPath(); g.roundRect(x, y, w, h, h * 0.16); g.fill();      // borde oscuro
  g.fillStyle = PAID; g.beginPath(); g.roundRect(x + 2, y + 2, w - 4, h - 4, h * 0.12); g.fill(); // cuerpo
  g.strokeStyle = "rgba(255,255,255,0.55)"; g.lineWidth = 1.5;
  g.beginPath(); g.roundRect(x + h * 0.16, y + h * 0.16, w - h * 0.32, h - h * 0.32, h * 0.08); g.stroke(); // filete interior
  g.fillStyle = "#ffffff"; g.beginPath(); g.arc(cx, cy, h * 0.3, 0, Math.PI * 2); g.fill();  // medallón
  g.fillStyle = "#15803d"; g.font = `700 ${Math.round(h * 0.46)}px ${family}`;
  g.textAlign = "center"; g.textBaseline = "middle"; g.fillText("$", cx, cy + h * 0.03);
  g.restore();
}

export type PosterOptions = {
  /** Familia tipográfica (CSS font-family) ya cargada, p. ej. la de next/font. */
  fontFamily?: string;
  /** Devuelve true si el dibujo quedó obsoleto (cambió la selección): no se pinta. */
  isCancelled?: () => boolean;
};

const rrect = (g: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) => {
  g.beginPath();
  g.roundRect(x, y, w, h, r);
};

/** Escribe texto ajustando el tamaño de fuente para que entre en `maxW`. */
function fitText(
  g: CanvasRenderingContext2D, text: string, x: number, y: number, maxW: number,
  size: number, weight: string, family: string, align: CanvasTextAlign = "left",
) {
  let s = size;
  g.font = `${weight} ${s}px ${family}`;
  while (s > 10 && g.measureText(text).width > maxW) { s -= 1; g.font = `${weight} ${s}px ${family}`; }
  g.textAlign = align; g.textBaseline = "middle";
  g.fillText(text, x, y);
}

/**
 * Dibuja la imagen de pre-inscriptos (estilo tabla de resultados) con hasta 2 categorías.
 * El alto del canvas depende de la cantidad de pilotos, así no se corta ninguno.
 */
export async function drawPoster(
  canvas: HTMLCanvasElement, cats: string[], rows: Row[], updateLine: string, opts: PosterOptions = {},
) {
  const family = opts.fontFamily ?? "Impact, 'Arial Black', sans-serif";
  const blocks = cats.map((c) => ({
    cat: c,
    cols: columnsFor(c),
    rows: rows.filter((r) => r.category === c).sort((a, b) => a.created_at.localeCompare(b.created_at)),
  }));

  // Precarga: banner y todos los logos usados (el canvas se pinta recién cuando todo está listo)
  const urls = new Set<string>(["/banner.webp"]);
  for (const b of blocks) for (const r of b.rows) for (const col of b.cols) {
    const u = brandImageByName(r[col.key]);
    if (u) urls.add(u);
  }
  const imgs = new Map<string, HTMLImageElement | null>();
  await Promise.all([...urls].map(async (u) => imgs.set(u, await loadImage(u))));
  if (opts.isCancelled?.()) return;

  const bodyH = blocks.reduce((h, b) => h + CAT_H + HEAD_H + Math.max(b.rows.length, 1) * (ROW_H + ROW_GAP) + BLOCK_GAP, 0);
  const anyPaid = blocks.some((b) => b.rows.some((r) => r.paid));
  const titleH = TITLE_H + (anyPaid ? LEGEND_H : 0);
  const H = BANNER_H + titleH + bodyH + FOOTER_H;
  canvas.width = W; canvas.height = H;
  const g = canvas.getContext("2d")!;

  // Fondo
  const bg = g.createLinearGradient(0, 0, 0, H);
  bg.addColorStop(0, "#0b1220"); bg.addColorStop(1, "#05070c");
  g.fillStyle = bg; g.fillRect(0, 0, W, H);

  // Banner (recorte superior: título y fechas) con fundido hacia el fondo
  const banner = imgs.get("/banner.webp");
  if (banner) {
    const srcH = (BANNER_H * banner.width) / W;
    g.drawImage(banner, 0, 0, banner.width, srcH, 0, 0, W, BANNER_H);
    const fade = g.createLinearGradient(0, BANNER_H - 90, 0, BANNER_H);
    fade.addColorStop(0, "rgba(11,18,32,0)"); fade.addColorStop(1, "#0b1220");
    g.fillStyle = fade; g.fillRect(0, BANNER_H - 90, W, 90);
  }

  // Título
  let y = BANNER_H;
  g.save();
  const ty = y + 36, skew = 0.18;
  g.transform(1, 0, -skew, 1, skew * ty, 0); // cursiva, compensando el corrimiento para que quede centrado
  g.fillStyle = "#ffffff"; g.shadowColor = "#1e90ff"; g.shadowBlur = 24;
  fitText(g, "PRE-INSCRIPTOS", W / 2, ty, W - 2 * M, 84, "700", family, "center");
  g.restore();
  g.fillStyle = "rgba(255,255,255,0.75)";
  fitText(g, updateLine, W / 2, y + 100, W - 2 * M, 28, "500", family, "center");
  if (anyPaid) { // leyenda: qué significa el billete
    const label = "INSCRIPCIÓN PAGA";
    g.font = "500 26px " + family;
    const w = g.measureText(label).width + 56;
    paidBill(g, W / 2 - w / 2 + 20, y + 140, 40, family);
    g.fillStyle = "rgba(255,255,255,0.85)";
    g.textAlign = "left"; g.textBaseline = "middle"; g.fillText(label, W / 2 - w / 2 + 52, y + 141);
  }
  y += titleH;

  const tableW = W - 2 * M;
  const numW = 70;

  for (const b of blocks) {
    const accent = ACCENT[b.cat] ?? "#e01414";
    const nameW = b.cols.length === 3 ? 330 : 290;
    const brandW = (tableW - numW - nameW - (b.cols.length + 1) * 6) / b.cols.length;
    const xNum = M, xName = xNum + numW + 6;
    const xCol = (i: number) => xName + nameW + 6 + i * (brandW + 6);

    // Barra de categoría
    g.fillStyle = "#0c0c0f"; rrect(g, M, y, tableW, CAT_H - 6, 6); g.fill();
    g.fillStyle = accent; g.fillRect(M, y, 14, CAT_H - 6);
    g.fillStyle = "#ffffff";
    fitText(g, b.cat.toUpperCase(), M + 34, y + (CAT_H - 6) / 2, tableW - 260, 44, "700", family);
    g.fillStyle = accent;
    fitText(g, `${b.rows.length} ${b.rows.length === 1 ? "PILOTO" : "PILOTOS"}`, M + tableW - 24, y + (CAT_H - 6) / 2, 220, 28, "500", family, "right");
    y += CAT_H;

    // Encabezado de columnas
    g.fillStyle = "#1b2233"; g.fillRect(M, y, tableW, HEAD_H - 6);
    g.fillStyle = "#ffffff";
    fitText(g, "#", xNum + numW / 2, y + (HEAD_H - 6) / 2, numW, 24, "700", family, "center");
    fitText(g, "PILOTO", xName + 18, y + (HEAD_H - 6) / 2, nameW, 24, "700", family);
    b.cols.forEach((c, i) => fitText(g, c.label, xCol(i) + brandW / 2, y + (HEAD_H - 6) / 2, brandW, 24, "700", family, "center"));
    y += HEAD_H;

    if (!b.rows.length) {
      g.fillStyle = "rgba(255,255,255,0.6)";
      fitText(g, "Todavía no hay pilotos inscriptos", W / 2, y + ROW_H / 2, tableW, 26, "500", family, "center");
      y += ROW_H + ROW_GAP;
    }

    b.rows.forEach((r, i) => {
      // número
      g.fillStyle = "#0c0c0f"; g.fillRect(xNum, y, numW, ROW_H);
      g.fillStyle = accent; g.fillRect(xNum, y, 6, ROW_H);
      g.fillStyle = "#ffffff";
      fitText(g, String(i + 1), xNum + numW / 2 + 3, y + ROW_H / 2, numW - 16, 34, "700", family, "center");
      // nombre
      g.fillStyle = "#ffffff"; g.fillRect(xName, y, nameW, ROW_H);
      g.fillStyle = "#0b0f1a";
      fitText(g, displayName(r), xName + 16, y + ROW_H / 2, nameW - 28 - (r.paid ? 52 : 0), 30, "700", family);
      if (r.paid) paidBill(g, xName + nameW - 34, y + ROW_H / 2, 44, family);
      // marcas
      b.cols.forEach((c, k) => {
        const x = xCol(k);
        g.fillStyle = "#ffffff"; g.fillRect(x, y, brandW, ROW_H);
        const value = r[c.key];
        const url = brandImageByName(value);
        const img = url ? imgs.get(url) : null;
        if (img) {
          const pad = 6, bw = brandW - pad * 2, bh = ROW_H - pad * 2;
          const k2 = Math.min(bw / img.width, bh / img.height);
          const dw = img.width * k2, dh = img.height * k2;
          g.drawImage(img, x + (brandW - dw) / 2, y + (ROW_H - dh) / 2, dw, dh);
        } else {
          g.fillStyle = "#0b0f1a";
          fitText(g, (value ?? "—").toUpperCase(), x + brandW / 2, y + ROW_H / 2, brandW - 16, 24, "700", family, "center");
        }
      });
      y += ROW_H + ROW_GAP;
    });
    y += BLOCK_GAP;
  }

  // Pie
  g.fillStyle = "rgba(255,255,255,0.7)";
  fitText(g, "CIRCUITO HERNÁN MATTICOLI · 20, 21 Y 22 DE NOVIEMBRE", W / 2, H - FOOTER_H / 2, W - 2 * M, 26, "500", family, "center");
}
