"use client";

import { useCallback } from "react";
import styles from "./MoveList.module.css";
import { MoveEntry } from "@/hooks/useChessGame";
import { AnalyzedMove } from "@prisma/client";

interface Props {
  moves: MoveEntry[];
  currentIndex: number;
  analyzedMoves?: Record<string, AnalyzedMove>;
  onGoToMove: (index: number) => void;
}

const formatSan = (san: string) => {
  if (!san) return "";
  return san
    .replace("N", "♞ ")
    .replace("B", "♝ ")
    .replace("R", "♜ ")
    .replace("Q", "♛ ")
    .replace("K", "♚ ");
};

const formatClassification = (classification?: string | null) => {
  if (classification === "Blunder") return " ??";
  if (classification === "Mistake") return " ?";
  if (classification === "Inaccuracy") return " ?!";
  if (classification === "Brilliant") return " !!";
  return "";
};

export function MoveList({ moves, currentIndex, analyzedMoves = {}, onGoToMove }: Props) {
  // Group moves into pairs: [[white, black?], ...]
  const pairs: (MoveEntry | null)[][] = [];
  for (let i = 0; i < moves.length; i += 2) {
    pairs.push([moves[i], moves[i + 1] ?? null]);
  }

  return (
    <div className={styles.container}>
      <button 
        className={`${styles.header} ${currentIndex === -1 ? styles.activeHeader : ""}`}
        onClick={() => onGoToMove(-1)}
      >
        Starting Position
      </button>
      <div className={styles.list}>
        {pairs.map((pair, pairIdx) => {
          const whiteIdx = pairIdx * 2;
          const blackIdx = pairIdx * 2 + 1;
          const isDarkRow = pairIdx % 2 === 1;
          
          return (
            <div key={pairIdx} className={`${styles.row} ${isDarkRow ? styles.rowDark : ""}`}>
              <span className={styles.moveNum}>{pairIdx + 1}.</span>
              
              {/* White Move */}
              <button
                className={`${styles.move} ${currentIndex === whiteIdx ? styles.active : ""} ${
                  analyzedMoves[pair[0]?.fenBefore || ""]?.classification === "Blunder" ? styles.blunder :
                  analyzedMoves[pair[0]?.fenBefore || ""]?.classification === "Mistake" ? styles.mistake :
                  analyzedMoves[pair[0]?.fenBefore || ""]?.classification === "Inaccuracy" ? styles.inaccuracy :
                  analyzedMoves[pair[0]?.fenBefore || ""]?.classification === "Brilliant" ? styles.brilliant : ""
                }`}
                onClick={() => onGoToMove(whiteIdx)}
              >
                {formatSan(pair[0]?.san || "")}
                <span className={styles.notationSuffix}>{formatClassification(analyzedMoves[pair[0]?.fenBefore || ""]?.classification)}</span>
              </button>

              {/* Black Move */}
              {pair[1] && (
                <button
                  className={`${styles.move} ${currentIndex === blackIdx ? styles.active : ""} ${
                    analyzedMoves[pair[1]?.fenBefore || ""]?.classification === "Blunder" ? styles.blunder :
                    analyzedMoves[pair[1]?.fenBefore || ""]?.classification === "Mistake" ? styles.mistake :
                    analyzedMoves[pair[1]?.fenBefore || ""]?.classification === "Inaccuracy" ? styles.inaccuracy :
                    analyzedMoves[pair[1]?.fenBefore || ""]?.classification === "Brilliant" ? styles.brilliant : ""
                  }`}
                  onClick={() => onGoToMove(blackIdx)}
                >
                  {formatSan(pair[1].san)}
                  <span className={styles.notationSuffix}>{formatClassification(analyzedMoves[pair[1]?.fenBefore || ""]?.classification)}</span>
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
