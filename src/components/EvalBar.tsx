"use client";

import styles from "./EvalBar.module.css";

interface Props {
  evaluation: number;   // centipawns: + = white, - = black
  mate: number | null;  // moves to mate (negative = black is mating)
  isCalculating: boolean;
  orientation?: "white" | "black";
}

/**
 * Maps an evaluation in centipawns to a percentage 0–100
 * where 50 = equal, 100 = white winning, 0 = black winning.
 * Uses a sigmoid-like curve so the bar saturates gracefully.
 */
function evalToPercent(cp: number): number {
  // sigmoid: 50 + 50 * tanh(cp / 400)
  return 50 + 50 * Math.tanh(cp / 400);
}

function formatEval(evaluation: number, mate: number | null): string {
  if (mate !== null) {
    return mate > 0 ? `M${mate}` : `M${Math.abs(mate)}`;
  }
  const abs = Math.abs(evaluation / 100);
  return (evaluation >= 0 ? "+" : "−") + abs.toFixed(2);
}

export function EvalBar({ evaluation, mate, isCalculating, orientation = "white" }: Props) {
  const percent = mate !== null
    ? (mate > 0 ? 98 : 2)
    : evalToPercent(evaluation);

  // When board is flipped, white's fill is at the bottom
  const whiteFillPercent = orientation === "white" ? percent : 100 - percent;

  return (
    <div className={styles.container} title={`Evaluation: ${formatEval(evaluation, mate)}`}>
      <div className={styles.bar}>
        {/* Black's portion (top) */}
        <div
          className={styles.blackPortion}
          style={{ height: `${100 - whiteFillPercent}%` }}
        />
        {/* White's portion (bottom) */}
        <div
          className={styles.whitePortion}
          style={{ height: `${whiteFillPercent}%` }}
        />
        {/* Divider line at 50% */}
        <div className={styles.centerLine} />
      </div>

      <div className={`${styles.label} ${isCalculating ? styles.calculating : ""}`}>
        {formatEval(evaluation, mate)}
      </div>
    </div>
  );
}
