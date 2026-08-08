"use client";

import { useCallback } from "react";
import styles from "./MoveList.module.css";
import { MoveEntry } from "@/hooks/useChessGame";

interface Props {
  moves: MoveEntry[];
  currentIndex: number;
  onGoToMove: (index: number) => void;
}

export function MoveList({ moves, currentIndex, onGoToMove }: Props) {
  // Group moves into pairs: [[white, black?], ...]
  const pairs: (MoveEntry | null)[][] = [];
  for (let i = 0; i < moves.length; i += 2) {
    pairs.push([moves[i], moves[i + 1] ?? null]);
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>Move List</div>
      <div className={styles.list}>
        {pairs.map((pair, pairIdx) => {
          const whiteIdx = pairIdx * 2;
          const blackIdx = pairIdx * 2 + 1;
          return (
            <div key={pairIdx} className={styles.row}>
              <span className={styles.moveNum}>{pairIdx + 1}.</span>
              <button
                className={`${styles.move} ${currentIndex === whiteIdx ? styles.active : ""}`}
                onClick={() => onGoToMove(whiteIdx)}
              >
                {pair[0]?.san}
              </button>
              {pair[1] && (
                <button
                  className={`${styles.move} ${currentIndex === blackIdx ? styles.active : ""}`}
                  onClick={() => onGoToMove(blackIdx)}
                >
                  {pair[1].san}
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
