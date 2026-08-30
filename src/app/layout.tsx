import type { Metadata, Viewport } from "next";
import "./globals.css";
import { PwaRegister } from "@/components/PwaRegister";

export const metadata: Metadata = {
  title: "Planificador de Menús Familiar & Lista de Compra",
  description: "Planifica menús semanales variados, organiza recetas favoritas y genera la lista de la compra al instante.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    title: "Menús de Casa",
    statusBarStyle: "default",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#059669",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <head>
        <link rel="icon" href="/icon.svg" />
        <link rel="apple-touch-icon" href="/icon.svg" />
      </head>
      <body>
        <PwaRegister />
        {children}
      </body>
    </html>
  );
}
