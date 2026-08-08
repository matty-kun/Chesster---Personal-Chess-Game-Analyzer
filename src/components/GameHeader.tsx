"use client";

import { ParsedGame } from "@/hooks/useChessGame";
import { AnalysisProgress } from "@/hooks/useGameAnalyzer";
import styles from "./GameHeader.module.css";

interface Props {
  game: ParsedGame;
  currentIndex: number;
  dbGameId?: string | null;
  isSaving?: boolean;
  onAnalyze?: () => void;
  analysisProgress?: AnalysisProgress;
}

export function GameHeader({ game, currentIndex, dbGameId, isSaving, onAnalyze, analysisProgress }: Props) {
  const { headers, moves } = game;

  const white = headers["White"] ?? "White";
  const black = headers["Black"] ?? "Black";
  const result = headers["Result"] ?? "*";
  const event = headers["Event"];
  const date = headers["Date"]?.replace(/\.\?{2}|\.\?{1}/g, "") ?? "";
  const currentMove = moves[currentIndex];

  return (
    <div className={styles.header}>
      <div className={styles.players}>
        <div className={styles.playerWhite}>
          <span className={styles.pieceIcon}>♔</span>
          <span className={styles.playerName}>{white}</span>
        </div>
        <div className={styles.result}>{result}</div>
        <div className={styles.playerBlack}>
          <span className={styles.playerName}>{black}</span>
          <span className={styles.pieceIcon}>♚</span>
        </div>
      </div>
      <div className={styles.meta}>
        {event && <span className={styles.tag}>{event}</span>}
        {date && <span className={styles.tag}>{date}</span>}
        {currentMove && (
          <span className={styles.tag}>
            Move {currentMove.moveNumber}{currentMove.color === "b" ? "…" : "."}
          </span>
        )}
        <span className={styles.tag}>{moves.length} moves</span>
        {isSaving ? (
          <span className={styles.tag}>☁️ Saving...</span>
        ) : dbGameId ? (
          <>
            <span className={styles.tag}>☁️ Saved</span>
            {analysisProgress?.isAnalyzing ? (
              <span className={styles.analyzeText}>
                Analyzing {analysisProgress.currentMove} / {analysisProgress.totalMoves}
              </span>
            ) : (
              <button className={styles.analyzeBtn} onClick={onAnalyze}>
                Analyze Game
              </button>
            )}
          </>
        ) : null}
      </div>
    </div>
  );
}
