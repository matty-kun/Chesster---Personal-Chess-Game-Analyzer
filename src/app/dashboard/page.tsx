import { getDashboardStatsAction } from "@/app/actions/dashboardActions";
import Link from "next/link";
import styles from "./page.module.css";
import { DashboardCharts } from "./DashboardCharts";

export default async function DashboardPage() {
  const result = await getDashboardStatsAction();

  if (!result.success || !result.stats) {
    return (
      <main className={styles.main}>
        <div className={styles.errorCard}>
          <h2>Failed to load dashboard</h2>
          <p>{result.error}</p>
          <Link href="/" className={styles.backBtn}>← Back to Game</Link>
        </div>
      </main>
    );
  }

  const { totalGames, totalAnalyzedMoves, breakdownData, trendData, recommendation, recentReflections } = result.stats;

  return (
    <main className={styles.main}>
      <div className={styles.content}>
        <h1 className={styles.title}>Your Progress</h1>
        
        <div className={styles.statsGrid}>
          <div className={styles.statCard}>
            <span className={styles.statLabel}>Games Played</span>
            <span className={styles.statValue}>{totalGames}</span>
          </div>
          <div className={styles.statCard}>
            <span className={styles.statLabel}>Analyzed Moves</span>
            <span className={styles.statValue}>{totalAnalyzedMoves}</span>
          </div>
          <div className={styles.statCard}>
            <span className={styles.statLabel}>Total Blunders</span>
            <span className={`${styles.statValue} ${styles.blunderText}`}>
              {breakdownData.find(d => d.name === "Blunders")?.value || 0}
            </span>
          </div>
        </div>

        {/* AI Coach Recommendation */}
        {recommendation && (
          <div className={styles.coachCard}>
            <div className={styles.coachHeader}>
              <span className={styles.coachIcon}>🤖</span>
              <h3>AI Coach Assessment</h3>
            </div>
            <div className={styles.coachContent}>
              <div className={styles.coachPhase}>
                <span className={styles.phaseLabel}>Weakest Phase:</span>
                <span className={styles.phaseValue}>{recommendation.weakestPhase}</span>
              </div>
              <p className={styles.coachAdvice}>{recommendation.advice}</p>
            </div>
          </div>
        )}

        {/* Client component for Recharts */}
        <DashboardCharts breakdownData={breakdownData} trendData={trendData} />

        {/* Recent Reflections */}
        {recentReflections && recentReflections.length > 0 && (
          <div className={styles.reflectionsFeed}>
            <h2 className={styles.feedTitle}>Recent Reflections</h2>
            <div className={styles.reflectionsList}>
              {recentReflections.map((ref: any) => (
                <div key={ref.id} className={styles.reflectionItem}>
                  <div className={styles.reflectionMeta}>
                    <span className={`${styles.badge} ${styles[ref.classification.toLowerCase()]}`}>
                      {ref.classification}
                    </span>
                    <span className={styles.reflectionSan}>Played: {ref.moveSan}</span>
                    <span className={styles.reflectionDate}>{ref.date}</span>
                  </div>
                  <p className={styles.reflectionText}>&quot;{ref.reflection}&quot;</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
