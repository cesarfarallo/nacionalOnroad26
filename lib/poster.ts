import type { Row } from "./csv";

const W = 1024, H = 1536;
const ACCENT: Record<string, [string, string]> = {
  "GT Eco": ["#ff8a00", "#c25a00"],
  "GT Nitro": ["#ff2a2a", "#a00000"],
  "1/8 SP": ["#ff2a2a", "#a00000"],
  "Touring Eco Modified": ["#1e90ff", "#0a4a99"],
  "Touring Eco Stock": ["#22c55e", "#0f7a37"],
};

export const displayName = (r: Row) =>
  (r.nickname?.trim() || r.last_name).toUpperCase();

/** Dibuja una imagen tipo "PRE-INSCRIPCIÓN" con hasta 2 categorías por imagen. */
export function drawPoster(canvas: HTMLCanvasElement, cats: string[], rows: Row[], dateText: string) {
  canvas.width = W; canvas.height = H;
  const g = canvas.getContext("2d")!;
  const bg = g.createLinearGradient(0, 0, 0, H);
  bg.addColorStop(0, "#1a0a0a"); bg.addColorStop(1, "#050506");
  g.fillStyle = bg; g.fillRect(0, 0, W, H);
  g.fillStyle = "#e01414"; g.fillRect(0, 0, W, 10);

  g.textAlign = "center"; g.fillStyle = "#fff";
  g.font = "italic 900 96px Impact, 'Arial Black', sans-serif";
  g.shadowColor = "#e01414"; g.shadowBlur = 20;
  g.fillText("PRE-INSCRIPCIÓN", W / 2, 130); g.shadowBlur = 0;
  g.font = "italic 900 40px Impact, 'Arial Black', sans-serif";
  g.fillStyle = "#ff3030"; g.fillText("AAPARTT NACIONAL ONROAD", W / 2, 190);
  g.fillStyle = "#fff"; g.font = "italic 900 84px Impact, 'Arial Black', sans-serif";
  g.fillText(dateText.toUpperCase(), W / 2, 300);

  g.fillStyle = "#111"; g.strokeStyle = "#e01414"; g.lineWidth = 3;
  g.fillRect(50, 350, W - 100, 80); g.strokeRect(50, 350, W - 100, 80);
  g.fillStyle = "#fff"; g.font = "italic 900 52px Impact, 'Arial Black', sans-serif";
  g.fillText("PILOTOS PRE-INSCRIPTOS", W / 2, 408);

  const colW = (W - 120) / Math.max(cats.length, 1);
  const rowH = 52;
  const maxRows = Math.floor((H - 560) / rowH);
  cats.forEach((cat, i) => {
    const x = 50 + i * (colW + 20) - (cats.length === 1 ? -(W - 100 - colW) / 2 + 0 : 0);
    const [c1, c2] = ACCENT[cat] ?? ["#ff2a2a", "#a00000"];
    g.fillStyle = "#0b0b0b"; g.strokeStyle = c1; g.lineWidth = 3;
    g.fillRect(x, 460, colW, 70); g.strokeRect(x, 460, colW, 70);
    g.fillStyle = c1; g.font = "italic 900 44px Impact, 'Arial Black', sans-serif";
    g.textAlign = "center"; g.fillText(cat.toUpperCase(), x + colW / 2, 512, colW - 20);
    rows.filter((r) => r.category === cat).slice(0, maxRows).forEach((r, j) => {
      const y = 550 + j * rowH;
      g.fillStyle = c1; g.fillRect(x, y, 56, rowH - 6);
      g.fillStyle = c2; g.fillRect(x + 40, y, 16, rowH - 6);
      g.fillStyle = "#fff"; g.font = "900 34px Impact, 'Arial Black', sans-serif";
      g.textAlign = "center"; g.fillText(String(j + 1), x + 26, y + 38);
      const lg = g.createLinearGradient(0, y, 0, y + rowH);
      lg.addColorStop(0, "#f5f5f5"); lg.addColorStop(1, "#9a9a9a");
      g.fillStyle = lg; g.fillRect(x + 60, y, colW - 60, rowH - 6);
      g.fillStyle = "#111"; g.textAlign = "left"; g.font = "900 32px Impact, 'Arial Black', sans-serif";
      g.fillText(displayName(r), x + 76, y + 38, colW - 96);
    });
  });
}
