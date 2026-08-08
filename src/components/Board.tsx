"use client";

import { Chessboard } from "react-chessboard";
import { Square } from "chess.js";
import styles from "./Board.module.css";

interface Props {
  fen: string;
  lastMove: { from: Square; to: Square } | null;
  boardWidth?: number;
  orientation?: "white" | "black";
  classification?: string | null;
}

const getAnnotationStyle = (classification: string): React.CSSProperties => {
  let color = "";
  let text = "";
  if (classification === "Blunder") { color = "%23ff5555"; text = "??"; }
  else if (classification === "Mistake") { color = "%23ffb86c"; text = "?"; }
  else if (classification === "Inaccuracy") { color = "%23f1fa8c"; text = "?!"; }
  else if (classification === "Brilliant") { color = "%236effa0"; text = "!!"; }
  else return {};

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><circle cx="10" cy="10" r="10" fill="${color}"/><text x="10" y="15" font-family="sans-serif" font-size="14" font-weight="bold" fill="%23000" text-anchor="middle">${text}</text></svg>`;
  
  return {
    backgroundImage: `url('data:image/svg+xml;utf8,${svg}')`,
    backgroundSize: '25%',
    backgroundRepeat: 'no-repeat',
    backgroundPosition: 'top right'
  };
};

export function Board({ fen, lastMove, boardWidth = 520, orientation = "white", classification }: Props) {
  const squareStyles: Record<string, React.CSSProperties> = {};
  if (lastMove) {
    squareStyles[lastMove.from] = { backgroundColor: "rgba(255, 214, 0, 0.4)" };
    squareStyles[lastMove.to]   = { backgroundColor: "rgba(255, 214, 0, 0.55)" };

    if (classification) {
      squareStyles[lastMove.to] = {
        ...squareStyles[lastMove.to],
        ...getAnnotationStyle(classification)
      };
    }
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
