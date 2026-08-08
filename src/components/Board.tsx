"use client";

import { Chessboard } from "react-chessboard";
import { Square } from "chess.js";
import styles from "./Board.module.css";

interface Props {
  fen: string;
  lastMove: { from: Square; to: Square } | null;
  boardWidth?: number;
  orientation?: "white" | "black";
}

export function Board({ fen, lastMove, boardWidth = 520, orientation = "white" }: Props) {
  const squareStyles: Record<string, React.CSSProperties> = {};
  if (lastMove) {
    squareStyles[lastMove.from] = { backgroundColor: "rgba(255, 214, 0, 0.4)" };
    squareStyles[lastMove.to]   = { backgroundColor: "rgba(255, 214, 0, 0.55)" };
  }

  return (
    <div className={styles.boardWrapper}>
      <Chessboard
        options={{
          position: fen,
          boardOrientation: orientation,
          allowDragging: false,
          squareStyles,
          darkSquareStyle:  { backgroundColor: "#3d5a80" },
          lightSquareStyle: { backgroundColor: "#e8f1f8" },
          boardStyle: {
            borderRadius: "8px",
            boxShadow: "0 8px 40px rgba(0,0,0,0.5)",
            width: `${boardWidth}px`,
            aspectRatio: "1",
          },
        }}
      />
    </div>
  );
}
