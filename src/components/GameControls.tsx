"use client";

import styles from "./GameControls.module.css";

interface Props {
  canGoPrev: boolean;
  canGoNext: boolean;
  onGoToStart: () => void;
  onGoPrev: () => void;
  onGoNext: () => void;
  onGoToEnd: () => void;
}

export function GameControls({ canGoPrev, canGoNext, onGoToStart, onGoPrev, onGoNext, onGoToEnd }: Props) {
  return (
    <div className={styles.controls}>
      <button
        className={styles.btn}
        onClick={onGoToStart}
        disabled={!canGoPrev}
        title="Go to start (↑)"
        aria-label="Go to start"
      >
        ⏮
      </button>
      <button
        className={styles.btn}
        onClick={onGoPrev}
        disabled={!canGoPrev}
        title="Previous move (←)"
        aria-label="Previous move"
      >
        ◀
      </button>
      <button
        className={styles.btn}
        onClick={onGoNext}
        disabled={!canGoNext}
        title="Next move (→)"
        aria-label="Next move"
      >
        ▶
      </button>
      <button
        className={styles.btn}
        onClick={onGoToEnd}
        disabled={!canGoNext}
        title="Go to end (↓)"
        aria-label="Go to end"
      >
        ⏭
      </button>
    </div>
  );
}
