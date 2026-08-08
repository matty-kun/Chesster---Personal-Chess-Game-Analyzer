"use client";

import { useChessGame } from "@/hooks/useChessGame";
import { Board } from "@/components/Board";
import { MoveList } from "@/components/MoveList";
import { GameControls } from "@/components/GameControls";
import { GameHeader } from "@/components/GameHeader";
import { PgnUploader } from "@/components/PgnUploader";
import styles from "./page.module.css";

export default function GamePage() {
  const {
    game,
    currentIndex,
    currentFen,
    lastMove,
    parseError,
    loadPgn,
    goToStart,
    goToEnd,
    goNext,
    goPrev,
    goToMove,
  } = useChessGame();

  return (
    <main className={styles.main}>
      {!game ? (
        <div className={styles.uploadView}>
          <div className={styles.uploadHeading}>
            <h1 className={styles.title}>
              <span className={styles.kingIcon}>♔</span>
              Chess Lens
            </h1>
            <p className={styles.subtitle}>
              Upload a PGN to replay, analyze, and learn from any game.
            </p>
          </div>
          <PgnUploader onLoad={loadPgn} error={parseError} />
        </div>
      ) : (
        <div className={styles.gameView}>
          {/* Top bar */}
          <div className={styles.topBar}>
            <button
              className={styles.backBtn}
              onClick={() => window.location.reload()}
              title="Load another game"
            >
              ← New Game
            </button>
            <span className={styles.appName}>♔ Chess Lens</span>
          </div>

          {/* Game layout */}
          <div className={styles.layout}>
            {/* Left: board + controls */}
            <div className={styles.boardColumn}>
              <GameHeader game={game} currentIndex={currentIndex} />
              <Board fen={currentFen} lastMove={lastMove} boardWidth={520} />
              <GameControls
                canGoPrev={currentIndex >= 0}
                canGoNext={currentIndex < game.moves.length - 1}
                onGoToStart={goToStart}
                onGoPrev={goPrev}
                onGoNext={goNext}
                onGoToEnd={goToEnd}
              />
              <p className={styles.keyboardHint}>
                Use ← → arrow keys to navigate
              </p>
            </div>

            {/* Right: move list */}
            <div className={styles.sideColumn}>
              <MoveList
                moves={game.moves}
                currentIndex={currentIndex}
                onGoToMove={goToMove}
              />
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
