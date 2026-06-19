import type { Metadata, Viewport } from "next";
import "./globals.css";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#f59e0b",
};

export const metadata: Metadata = {
  title: "Gala de Retrouvailles",
  description: "Gestion des tickets du Gala de Retrouvailles",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    title: "Gala",
    statusBarStyle: "black-translucent",
  },
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
