import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Gala de Retrouvailles",
  description: "Gestion des tickets du Gala de Retrouvailles",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" className="h-full">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
