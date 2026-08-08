import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Chess Lens — Analyze & Improve Your Chess",
  description:
    "Replay any chess game, analyze with Stockfish, track your mistakes over time, and get personalized study recommendations.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
