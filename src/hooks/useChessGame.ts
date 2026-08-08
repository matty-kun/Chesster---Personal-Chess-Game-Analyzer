import { Chess, Square } from "chess.js";
import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from "react";
import { saveGameAction } from "@/app/actions/gameActions";

export interface MoveEntry {
  san: string;
  uci: string;
  fenBefore: string;
  fenAfter: string;
  moveNumber: number;
  color: "w" | "b";
  comment?: string;
}

export interface ParsedGame {
  headers: Record<string, string>;
  moves: MoveEntry[];
  pgn: string;
}

function parsePgn(pgn: string): ParsedGame | null {
  try {
    const chess = new Chess();
    chess.loadPgn(pgn);

    const headers: Record<string, string> = {};
    for (const [key, value] of Object.entries(chess.header())) {
      headers[key] = value ?? "";
    }

    // Replay to extract per-move FENs
    const fullPgn = chess.pgn();
    const history = chess.history({ verbose: true });

    const replay = new Chess();
    const moves: MoveEntry[] = history.map((move, idx) => {
      const fenBefore = replay.fen();
      replay.move(move.san);
      const fenAfter = replay.fen();
      return {
        san: move.san,
        uci: `${move.from}${move.to}${move.promotion ?? ""}`,
        fenBefore,
        fenAfter,
        moveNumber: Math.floor(idx / 2) + 1,
        color: move.color,
      };
    });

    return { headers, moves, pgn: fullPgn };
  } catch {
    return null;
  }
}

export function useChessGame() {
  const [game, setGame] = useState<ParsedGame | null>(null);
  const [currentIndex, setCurrentIndex] = useState(-1); // -1 = start position
  const [parseError, setParseError] = useState<string | null>(null);
  const [dbGameId, setDbGameId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const currentFen = useMemo(() => {
    if (!game) return "start";
    if (currentIndex < 0) return game.moves[0]?.fenBefore ?? "start";
    return game.moves[currentIndex]?.fenAfter ?? "start";
  }, [game, currentIndex]);

  const lastMove = useMemo((): { from: Square; to: Square } | null => {
    if (!game || currentIndex < 0) return null;
    const m = game.moves[currentIndex];
    if (!m) return null;
    return {
      from: m.uci.slice(0, 2) as Square,
      to: m.uci.slice(2, 4) as Square,
    };
  }, [game, currentIndex]);

  const loadExistingGame = useCallback((pgnData: string, existingGameId: string) => {
    try {
      const parsed = parsePgn(pgnData);
      if (parsed) {
        setGame(parsed);
        setParseError(null);
        setCurrentIndex(-1);
        setDbGameId(existingGameId);
      } else {
        setParseError("Invalid PGN format");
      }
    } catch (err) {
      setParseError(err instanceof Error ? err.message : "Failed to parse PGN");
    }
  }, []);

  const loadPgn = useCallback((pgn: string) => {
    const parsed = parsePgn(pgn);
    if (!parsed) {
      setParseError("Invalid PGN — could not parse the game.");
      return false;
    }
    setParseError(null);
    setGame(parsed);
    setCurrentIndex(-1);
    setDbGameId(null); // Reset until saved

    // Save to database asynchronously
    startTransition(async () => {
      const result = await saveGameAction(parsed.pgn);
      if (result.success && result.gameId) {
        setDbGameId(result.gameId);
      }
    });

    return true;
  }, []);

  const goToStart = useCallback(() => setCurrentIndex(-1), []);
  const goToEnd = useCallback(() => {
    if (game) setCurrentIndex(game.moves.length - 1);
  }, [game]);
  const goNext = useCallback(() => {
    if (game) setCurrentIndex((i) => Math.min(i + 1, game.moves.length - 1));
  }, [game]);
  const goPrev = useCallback(() => {
    setCurrentIndex((i) => Math.max(i - 1, -1));
  }, []);
  const goToMove = useCallback((index: number) => {
    if (game) setCurrentIndex(Math.max(-1, Math.min(index, game.moves.length - 1)));
  }, [game]);

  // Keyboard navigation
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") goNext();
      if (e.key === "ArrowLeft") goPrev();
      if (e.key === "ArrowUp") goToStart();
      if (e.key === "ArrowDown") goToEnd();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [goNext, goPrev, goToStart, goToEnd]);

  return {
    game,
    dbGameId,
    isSaving: isPending,
    currentIndex,
    currentFen,
    lastMove,
    parseError,
    loadPgn,
    loadExistingGame,
    goToStart,
    goToEnd,
    goNext,
    goPrev,
    goToMove,
  };
}
