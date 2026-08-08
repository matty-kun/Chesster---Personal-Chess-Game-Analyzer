import { getGamesAction } from "@/app/actions/gameActions";
import Link from "next/link";
import styles from "./page.module.css";

export const dynamic = "force-dynamic"; // Ensure it fetches fresh data

export default async function GamesPage() {
  const result = await getGamesAction();
  const games = result.success ? result.games : [];

  return (
    <main className={styles.main}>
      <div className={styles.header}>
        <h1 className={styles.title}>My Games</h1>
        <p className={styles.subtitle}>Review your previously uploaded and analyzed games.</p>
      </div>

      {games && games.length > 0 ? (
        <div className={styles.grid}>
          {games.map((game) => (
            <Link key={game.id} href={`/?gameId=${game.id}`} className={styles.gameCard}>
              <h3 className={styles.matchup}>
                {game.white} <span style={{ color: "var(--muted)", fontWeight: "normal" }}>vs</span> {game.black}
              </h3>
              <div className={styles.meta}>
                <span>{game.date ? new Date(game.date).toLocaleDateString() : "Unknown Date"}</span>
                {game.result && <span className={styles.result}>{game.result}</span>}
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className={styles.emptyState}>
          <h3>No games found</h3>
          <p>You haven&apos;t uploaded any games yet. Head over to the Game Viewer to upload a PGN!</p>
          <Link href="/" style={{ color: "var(--primary)", textDecoration: "underline", marginTop: "1rem", display: "inline-block" }}>
            Go to Game Viewer
          </Link>
        </div>
      )}
    </main>
  );
}
