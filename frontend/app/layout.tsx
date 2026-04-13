import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "BilimAI",
  description: "Bilimni isbotlaydigan EdTech platforma",
  icons: {
    icon: "/logo-brand-v2.png"
  }
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="uz">
      <body>{children}</body>
    </html>
  );
}
