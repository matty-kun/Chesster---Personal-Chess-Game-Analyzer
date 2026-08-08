"use client";

import { useState, useEffect } from "react";
import { Chess } from "chess.js";
import { EngineResult } from "@/hooks/useStockfish";
import { AnalyzedMove } from "@prisma/client";
import styles from "./EnginePanel.module.css";

interface Props {
  result: EngineResult;
  engineReady: boolean;
  currentFen: string;
  analyzedMove?: AnalyzedMove | null;
  onSaveReflection?: (moveId: string, text: string) => Promise<void>;
}

/** Convert a UCI move string (e.g. "e2e4") to SAN using chess.js */
function uciToSan(fen: string, uci: string): string | null {
  try {
    const chess = new Chess(fen);
    const from = uci.slice(0, 2);
    const to = uci.slice(2, 4);
    const promotion = uci[4];
    const move = chess.move({ from, to, promotion });
    return move?.san ?? null;
  } catch {
    return null;
  }
}

/** Convert the PV (array of UCI moves) to a readable SAN sequence */
function pvToSan(startFen: string, pv: string[]): string {
  const chess = new Chess(startFen);
  const sans: string[] = [];
  for (const uci of pv.slice(0, 6)) {
    try {
      const from = uci.slice(0, 2);
      const to = uci.slice(2, 4);
      const promotion = uci[4];
      const move = chess.move({ from, to, promotion });
      if (!move) break;
      sans.push(move.san);
    } catch {
      break;
    }
  }
  return sans.join(" ");
}

function formatEval(evaluation: number, mate: number | null): string {
  if (mate !== null) {
    return mate > 0 ? `Mate in ${mate}` : `Mated in ${Math.abs(mate)}`;
  }
  const pawn = evaluation / 100;
  const sign = pawn >= 0 ? "+" : "";
  return `${sign}${pawn.toFixed(2)}`;
}

function evalColor(evaluation: number, mate: number | null): string {
  if (mate !== null) return mate > 0 ? "#6effa0" : "#ff7070";
  if (evaluation > 50) return "#6effa0";
  if (evaluation < -50) return "#ff7070";
  return "rgba(232,241,248,0.7)";
}

export function EnginePanel({ result, engineReady, currentFen, analyzedMove, onSaveReflection }: Props) {
  const { bestMove, evaluation, mate, depth, principalVariation, isCalculating } = result;

  const [reflectionText, setReflectionText] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  // Sync reflection text if we navigate to a move that already has one
  useEffect(() => {
    setReflectionText(analyzedMove?.humanReflection || "");
  }, [analyzedMove?.id, analyzedMove?.humanReflection]);

  const handleSaveReflection = async () => {
    if (!analyzedMove || !onSaveReflection) return;
    setIsSaving(true);
    await onSaveReflection(analyzedMove.id, reflectionText);
    setIsSaving(false);
  };

  const bestMoveSan = bestMove ? uciToSan(currentFen, bestMove) : null;
  const pvSan = principalVariation.length > 0 ? pvToSan(currentFen, principalVariation) : null;

  if (!engineReady) {
    return (
      <div className={styles.panel}>
        <div className={styles.header}>Engine</div>
        <div className={styles.loading}>
          <span className={styles.dot} />
          <span className={styles.dot} />
          <span className={styles.dot} />
          Loading Stockfish…
        </div>
      </div>
    );
  }

  return (
    <div className={styles.panel}>
      <div className={styles.header}>
        <span>Stockfish 18</span>
        {isCalculating && <span className={styles.thinkingBadge}>thinking…</span>}
        {!isCalculating && depth > 0 && (
          <span className={styles.depthBadge}>depth {depth}</span>
        )}
      </div>

      <div className={styles.body}>
        {/* Evaluation */}
        <div className={styles.row}>
          <span className={styles.rowLabel}>Eval</span>
          <span
            className={styles.evalValue}
            style={{ color: evalColor(evaluation, mate) }}
          >
            {depth > 0 ? formatEval(evaluation, mate) : "—"}
          </span>
        </div>

        {/* Best move */}
        <div className={styles.row}>
          <span className={styles.rowLabel}>Best</span>
          <span className={styles.bestMove}>
            {bestMoveSan ?? (isCalculating ? "…" : "—")}
          </span>
        </div>

        {/* Principal variation */}
        {pvSan && (
          <div className={styles.pvSection}>
            <span className={styles.rowLabel}>Line</span>
            <span className={styles.pv}>{pvSan}</span>
          </div>
        )}

        {/* Reflection Journal (only shows if move is classified as mistake/blunder/inaccuracy) */}
        {analyzedMove && analyzedMove.classification && (
          <div className={styles.reflectionSection}>
            <div className={styles.reflectionHeader}>
              <span className={styles.reflectionIcon}>📝</span>
              <span className={styles.reflectionTitle}>Reflection Journal</span>
              <span className={`${styles.badge} ${styles[analyzedMove.classification.toLowerCase()]}`}>
                {analyzedMove.classification}
              </span>
            </div>
            <textarea
              className={styles.reflectionInput}
              placeholder="Why did you play this move? What did you miss?"
              value={reflectionText}
              onChange={(e) => setReflectionText(e.target.value)}
            />
            <button
              className={styles.saveBtn}
              onClick={handleSaveReflection}
              disabled={isSaving || reflectionText === (analyzedMove.humanReflection || "")}
            >
              {isSaving ? "Saving..." : "Save Note"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
