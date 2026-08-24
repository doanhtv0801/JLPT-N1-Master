import type { Metadata } from "next";
import { Providers } from "@/components/layout/providers";
import "./globals.css";

// Deliberately not using next/font/google here: this keeps the production
// build fully self-hostable with zero network access at build time (no
// dependency on fonts.googleapis.com in restricted/offline/CI environments).
// The full fallback stack (system UI fonts + Japanese-aware faces) lives in
// globals.css under `--font-sans` / `--font-jp`.

export const metadata: Metadata = {
  title: "JLPT N1 Master — Aim for 180/180",
  description:
    "Master Japanese vocabulary at an advanced level. A JLPT N1 mastery platform built around depth, not shallow memorization.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning className="h-full antialiased">
      <body className="min-h-full flex flex-col">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
