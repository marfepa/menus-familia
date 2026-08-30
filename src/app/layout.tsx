import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Planificador de Menús Familiar & Lista de Compra",
  description: "Planifica menús semanales variados, organiza recetas favoritas y genera la lista de la compra al instante.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
        <link rel="icon" href="data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>🥑</text></svg>" />
      </head>
      <body>{children}</body>
    </html>
  );
}
