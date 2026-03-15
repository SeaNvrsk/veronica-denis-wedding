import type { Metadata, Viewport } from "next";
import { Cormorant_Garamond, Lato } from "next/font/google";
import "./globals.css";

const cormorant = Cormorant_Garamond({
  variable: "--font-cormorant",
  subsets: ["latin", "cyrillic"],
  weight: ["400", "500", "600", "700"],
});

const lato = Lato({
  variable: "--font-lato",
  subsets: ["latin", "latin-ext"],
  weight: ["300", "400", "700"],
});

export const metadata: Metadata = {
  title: "Вероника и Денис — Свадьба 2026",
  description:
    "Приглашаем разделить нашу радость. 21 марта 2026, 9:30, Сочи. Гостевой альбом, викторина и блог.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: "#4f46e5",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru" className={`${cormorant.variable} ${lato.variable}`}>
      <body className="font-sans antialiased bg-indigo-50/30">
        {children}
      </body>
    </html>
  );
}
