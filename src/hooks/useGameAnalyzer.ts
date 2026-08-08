import { useState, useCallback, useRef } from "react";
import { ParsedGame } from "./useChessGame";
import { saveAnalyzedMoveAction, getAnalyzedMovesAction } from "@/app/actions/gameActions";
import { AnalyzedMove } from "@prisma/client";

export interface AnalysisProgress {
  isAnalyzing: boolean;
  currentMove: number;
  totalMoves: number;
}

export function useGameAnalyzer(dbGameId: string | null) {
  const [progress, setProgress] = useState<AnalysisProgress>({
    isAnalyzing: false,
    currentMove: 0,
    totalMoves: 0,
  });
  const [analyzedMoves, setAnalyzedMoves] = useState<Record<string, AnalyzedMove>>({});

  const workerRef = useRef<Worker | null>(null);

  const loadAnalyzedMoves = useCallback(async () => {
    if (!dbGameId) return;
    const result = await getAnalyzedMovesAction(dbGameId);
    if (result.success && result.moves) {
      const map: Record<string, AnalyzedMove> = {};
      result.moves.forEach(m => {
        // Create a unique key for the move (e.g. "12-w" or just the FEN)
        // FEN is safest
        map[m.fen] = m;
      });
      setAnalyzedMoves(map);
    }
  }, [dbGameId]);

  const startAnalysis = useCallback(
    async (game: ParsedGame) => {
      if (progress.isAnalyzing || !dbGameId) return;
      
      setProgress({ isAnalyzing: true, currentMove: 0, totalMoves: game.moves.length });

      // Spawn a dedicated worker for background analysis
      const worker = new Worker("/engine/stockfish-worker.js");
      workerRef.current = worker;
      worker.postMessage("uci");

      // Helper to evaluate a position
      const evaluateFen = (fen: string): Promise<{ evalCp: number; bestMoveSan: string | null }> => {
        return new Promise((resolve) => {
          let currentEval = 0;
          let bestMove = null;

          const listener = (e: MessageEvent) => {
            const msg = e.data as string;
            
            // Extract evaluation
            const scoreMatch = msg.match(/score cp (-?\d+)/);
            if (scoreMatch) currentEval = parseInt(scoreMatch[1], 10);
            
            const mateMatch = msg.match(/score mate (-?\d+)/);
            if (mateMatch) {
              const mateIn = parseInt(mateMatch[1], 10);
              currentEval = mateIn > 0 ? 10000 - mateIn : -10000 - mateIn;
            }

            // Extract best move and resolve when done
            if (msg.startsWith("bestmove")) {
              worker.removeEventListener("message", listener);
              const parts = msg.split(" ");
              if (parts.length >= 2) {
                bestMove = parts[1]; // UCI format
              }
              resolve({ evalCp: currentEval, bestMoveSan: bestMove });
            }
          };

          worker.addEventListener("message", listener);
          worker.postMessage(`position fen ${fen}`);
          worker.postMessage(`go movetime 500`); // 500ms per position for speed
        });
      };

      try {
        for (let i = 0; i < game.moves.length; i++) {
          const move = game.moves[i];
          setProgress((p) => ({ ...p, currentMove: i + 1 }));

          // 1. Eval position BEFORE the move
          const before = await evaluateFen(move.fenBefore);
          
          // 2. Eval position AFTER the move
          const after = await evaluateFen(move.fenAfter);

          // Stockfish eval is from perspective of side-to-move.
          // before.evalCp is side-to-move (e.g. White).
          // after.evalCp is OTHER side (e.g. Black).
          // To compare them from White's perspective:
          const evalBeforeContext = before.evalCp;
          // The eval after the move from the SAME side's perspective is negative of the opponent's eval
          const evalAfterContext = -after.evalCp;

          // Drop is how much WORSE the evaluation got for the player who just moved
          const evalDrop = (evalBeforeContext - evalAfterContext) / 100; // convert cp to pawns

          // Classify the move
          let classification = null;
          if (evalDrop > 3.0) classification = "Blunder";
          else if (evalDrop > 1.5) classification = "Mistake";
          else if (evalDrop > 0.8) classification = "Inaccuracy";

          // If it's a mistake, save it to the DB and update local state
          if (classification) {
            const result = await saveAnalyzedMoveAction({
              gameId: dbGameId,
              fen: move.fenBefore,
              moveNumber: move.moveNumber,
              color: move.color === "w" ? "white" : "black",
              playedMoveSan: move.san,
              bestMoveSan: before.bestMoveSan, // Note: this is currently UCI, would need chess.js conversion for strict SAN
              evalBefore: evalBeforeContext / 100,
              evalAfter: evalAfterContext / 100,
              evalDrop: evalDrop,
              classification,
            });

            if (result.success) {
              setAnalyzedMoves(prev => ({
                ...prev,
                [move.fenBefore]: {
                  id: result.moveId!,
                  gameId: dbGameId,
                  fen: move.fenBefore,
                  moveNumber: move.moveNumber,
                  color: move.color === "w" ? "white" : "black",
                  playedMoveSan: move.san,
                  bestMoveSan: before.bestMoveSan,
                  evalBefore: evalBeforeContext / 100,
                  evalAfter: evalAfterContext / 100,
                  evalDrop: evalDrop,
                  classification,
                  humanReflection: null,
                  tags: [],
                  createdAt: new Date(),
                }
              }));
            }
          }
        }
      } catch (error) {
        console.error("Analysis interrupted or failed:", error);
      } finally {
        worker.terminate();
        workerRef.current = null;
        setProgress((p) => ({ ...p, isAnalyzing: false }));
      }
    },
    [progress.isAnalyzing]
  );

  const stopAnalysis = useCallback(() => {
    if (workerRef.current) {
      workerRef.current.terminate();
      workerRef.current = null;
      setProgress((p) => ({ ...p, isAnalyzing: false }));
    }
  }, []);

  return { progress, analyzedMoves, loadAnalyzedMoves, startAnalysis, stopAnalysis };
}
