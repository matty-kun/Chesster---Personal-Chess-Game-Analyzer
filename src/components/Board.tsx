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

const CUSTOM_SQUARE_STYLES_FROM = { backgroundColor: "rgba(255, 214, 0, 0.4)" };
const CUSTOM_SQUARE_STYLES_TO = { backgroundColor: "rgba(255, 214, 0, 0.55)" };

export function Board({ fen, lastMove, boardWidth = 520, orientation = "white" }: Props) {
  const customSquareStyles: Record<string, React.CSSProperties> = {};
  if (lastMove) {
    customSquareStyles[lastMove.from] = CUSTOM_SQUARE_STYLES_FROM;
    customSquareStyles[lastMove.to] = CUSTOM_SQUARE_STYLES_TO;
  }

  return (
    <div className={styles.boardWrapper}>
      <Chessboard
        id="main-board"
        position={fen}
        boardWidth={boardWidth}
        boardOrientation={orientation}
        arePiecesDraggable={false}
        customSquareStyles={customSquareStyles}
        customDarkSquareStyle={{ backgroundColor: "#3d5a80" }}
        customLightSquareStyle={{ backgroundColor: "#e8f1f8" }}
        customBoardStyle={{
          borderRadius: "8px",
          boxShadow: "0 8px 40px rgba(0,0,0,0.5)",
        }}
      />
    </div>
  );
}
