import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";
import styles from "./layout.module.css";

export const metadata: Metadata = {
  title: "Chesster — Analyze & Improve Your Chess",
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
      <body>
        <div className={styles.layout}>
          {/* Fixed Left Sidebar */}
          <aside className={styles.sidebar}>
            <div className={styles.brand}>
              Chesster
            </div>
            
            <nav className={styles.nav}>
              <Link href="/" className={styles.navLink}>
                <span className={styles.icon}>→</span> Game Viewer
              </Link>
              <Link href="/dashboard" className={styles.navLink}>
                <span className={styles.icon}>◱</span> Dashboard
              </Link>
              <Link href="#" className={styles.navLink}>
                <span className={styles.icon}>⚡</span> Engine Config
              </Link>
            </nav>

            <div className={styles.footer}>
              <p>For support, bugs & everything else, reach me at</p>
              <a href="mailto:support@chesster.app">
                <span>✉</span> support@chesster.app
              </a>
            </div>
          </aside>

          {/* Main Content Area */}
          <main className={styles.mainContent}>
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
