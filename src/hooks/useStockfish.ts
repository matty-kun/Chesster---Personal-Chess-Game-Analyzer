"use client";

import { useEffect, useRef, useState, useCallback } from "react";

export interface EngineResult {
  fen: string;
  bestMove: string | null;       // e.g. "e2e4"
  evaluation: number;            // centipawns (+ = white, - = black)
  mate: number | null;           // moves to mate if forced
  depth: number;
  principalVariation: string[];  // UCI moves
  isCalculating: boolean;
}

const DEFAULT_RESULT: EngineResult = {
  fen: "",
  bestMove: null,
  evaluation: 0,
  mate: null,
  depth: 0,
  principalVariation: [],
  isCalculating: false,
};

// Parse Stockfish "info" line into partial EngineResult fields
function parseInfoLine(line: string): Partial<EngineResult> {
  const result: Partial<EngineResult> = {};

  const depthMatch = line.match(/\bdepth (\d+)/);
  if (depthMatch) result.depth = parseInt(depthMatch[1], 10);

  const mateMatch = line.match(/\bscore mate (-?\d+)/);
  if (mateMatch) {
    result.mate = parseInt(mateMatch[1], 10);
    result.evaluation = mateMatch[1].startsWith("-") ? -Infinity : Infinity;
  } else {
    const cpMatch = line.match(/\bscore cp (-?\d+)/);
    if (cpMatch) {
      result.evaluation = parseInt(cpMatch[1], 10);
      result.mate = null;
    }
  }

  const pvMatch = line.match(/\bpv (.+)$/);
  if (pvMatch) {
    result.principalVariation = pvMatch[1].trim().split(" ");
  }

  return result;
}

export function useStockfish(movetime = 800) {
  const workerRef = useRef<Worker | null>(null);
  const [result, setResult] = useState<EngineResult>(DEFAULT_RESULT);
  const [engineReady, setEngineReady] = useState(false);
  const currentFenRef = useRef<string>("");
  const pendingResultRef = useRef<Partial<EngineResult>>({});

  // Initialise worker once
  useEffect(() => {
    const worker = new Worker("/engine/stockfish-worker.js");
    workerRef.current = worker;

    worker.onmessage = (e: MessageEvent<string>) => {
      const line: string = typeof e.data === "string" ? e.data : String(e.data);

      if (line === "uciok") {
        worker.postMessage("isready");
        return;
      }

      if (line === "readyok") {
        setEngineReady(true);
        return;
      }

      if (line.startsWith("info") && line.includes("depth") && line.includes("score")) {
        const parsed = parseInfoLine(line);
        pendingResultRef.current = { ...pendingResultRef.current, ...parsed };
        // Update UI with each depth tick so the bar animates
        setResult((prev) => ({
          ...prev,
          ...pendingResultRef.current,
          fen: currentFenRef.current,
          isCalculating: true,
        }));
        return;
      }

      if (line.startsWith("bestmove")) {
        const parts = line.split(" ");
        const bestMove = parts[1] && parts[1] !== "(none)" ? parts[1] : null;
        setResult((prev) => ({
          ...prev,
          ...pendingResultRef.current,
          bestMove,
          fen: currentFenRef.current,
          isCalculating: false,
        }));
        pendingResultRef.current = {};
        return;
      }
    };

    worker.postMessage("uci");

    return () => {
      worker.terminate();
    };
  }, []);

  const analyze = useCallback(
    (fen: string) => {
      const worker = workerRef.current;
      if (!worker || !engineReady) return;

      currentFenRef.current = fen;
      pendingResultRef.current = {};

      setResult((prev) => ({ ...prev, isCalculating: true, bestMove: null }));

      worker.postMessage("stop");
      worker.postMessage(`position fen ${fen}`);
      worker.postMessage(`go movetime ${movetime}`);
    },
    [engineReady, movetime]
  );

  const stop = useCallback(() => {
    workerRef.current?.postMessage("stop");
  }, []);

  return { result, engineReady, analyze, stop };
}
