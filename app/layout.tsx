import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "AAPARTT Nacional Onroad – Inscripción",
  description: "Inscripción al Nacional Onroad, 20-22 de noviembre, Circuito Hernán Matticoli.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
