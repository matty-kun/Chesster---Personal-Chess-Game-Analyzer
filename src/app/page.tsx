"use client";

import { useEffect, useRef, useState } from "react";
import { useChessGame } from "@/hooks/useChessGame";
import { useStockfish } from "@/hooks/useStockfish";
import { Board } from "@/components/Board";
import { MoveList } from "@/components/MoveList";
import { GameControls } from "@/components/GameControls";
import { GameHeader } from "@/components/GameHeader";
import { EvalBar } from "@/components/EvalBar";
import { EnginePanel } from "@/components/EnginePanel";
import { PgnUploader } from "@/components/PgnUploader";
import styles from "./page.module.css";

export default function GamePage() {
  const boardColumnRef = useRef<HTMLDivElement>(null);
  const [boardWidth, setBoardWidth] = useState(460);

  useEffect(() => {
    const el = boardColumnRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      const w = entries[0]?.contentRect.width ?? el.clientWidth;
      // subtract eval bar (24px) + gap (8px) so the board fits inside boardRow
      setBoardWidth(Math.min(Math.max(w - 32, 240), 600));
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

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

  const { result: engineResult, engineReady, analyze } = useStockfish(800);

  // Re-analyze whenever the position changes (debounced so rapid nav doesn't thrash the engine)
  useEffect(() => {
    if (!game || !currentFen) return;
    const timer = setTimeout(() => analyze(currentFen), 150);
    return () => clearTimeout(timer);
  }, [currentFen, game, analyze]);

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
            >
              ← New Game
            </button>
            <span className={styles.appName}>♔ Chess Lens</span>
          </div>

          {/* Game layout */}
          <div className={styles.layout}>
            {/* Board column */}
            <div className={styles.boardColumn} ref={boardColumnRef}>
              <GameHeader game={game} currentIndex={currentIndex} />
              <div className={styles.boardRow}>
                <EvalBar
                  evaluation={engineResult.evaluation}
                  mate={engineResult.mate}
                  isCalculating={engineResult.isCalculating}
                />
                <Board fen={currentFen} lastMove={lastMove} boardWidth={boardWidth} />
              </div>
              <GameControls
                canGoPrev={currentIndex >= 0}
                canGoNext={currentIndex < game.moves.length - 1}
                onGoToStart={goToStart}
                onGoPrev={goPrev}
                onGoNext={goNext}
                onGoToEnd={goToEnd}
              />
              <p className={styles.keyboardHint}>Use ← → arrow keys to navigate</p>
            </div>

            {/* Side column: engine + move list */}
            <div className={styles.sideColumn}>
              <EnginePanel
                result={engineResult}
                engineReady={engineReady}
                currentFen={currentFen}
              />
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

