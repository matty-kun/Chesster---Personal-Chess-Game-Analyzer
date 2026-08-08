"use server";

import prisma from "@/lib/prisma";
import { Chess } from "chess.js";

/**
 * Saves a new game to the database.
 * Parses the PGN to extract headers (White, Black, Date, Result, Event).
 */
export async function saveGameAction(pgn: string) {
  try {
    const chess = new Chess();
    chess.loadPgn(pgn);
    
    const white = chess.header().White ?? "Unknown";
    const black = chess.header().Black ?? "Unknown";
    const result = chess.header().Result ?? "*";
    const event = chess.header().Event ?? "Casual Game";
    
    const headerDate = chess.header().Date;
    let date = null;
    if (headerDate && headerDate !== "????.??.??") {
      // PGN dates are usually YYYY.MM.DD
      const dateStr = headerDate.replace(/\./g, "-");
      date = new Date(dateStr);
    }

    // Deduplication check: if this exact PGN is already in the database, return it instead of creating a new one.
    const existingGame = await prisma.game.findFirst({
      where: { pgn },
    });

    if (existingGame) {
      return { success: true, gameId: existingGame.id };
    }

    const game = await prisma.game.create({
      data: {
        pgn,
        white,
        black,
        result,
        event,
        date: date && !isNaN(date.getTime()) ? date : null,
      },
    });

    return { success: true, gameId: game.id };
  } catch (error) {
    console.error("Failed to save game:", error);
    return { success: false, error: "Failed to parse or save PGN." };
  }
}

/**
 * Saves an analyzed move (e.g., a mistake or blunder) to the database.
 * This links the specific critical moment to the uploaded Game.
 */
export async function saveAnalyzedMoveAction({
  gameId,
  fen,
  moveNumber,
  color,
  playedMoveSan,
  bestMoveSan,
  evalBefore,
  evalAfter,
  evalDrop,
  classification,
}: {
  gameId: string;
  fen: string;
  moveNumber: number;
  color: string;
  playedMoveSan: string;
  bestMoveSan: string | null;
  evalBefore: number;
  evalAfter: number;
  evalDrop: number;
  classification: string;
}) {
  try {
    const analyzedMove = await prisma.analyzedMove.create({
      data: {
        gameId,
        fen,
        moveNumber,
        color,
        playedMoveSan,
        bestMoveSan,
        evalBefore,
        evalAfter,
        evalDrop,
        classification,
      },
    });
    
    return { success: true, moveId: analyzedMove.id };
  } catch (error) {
    console.error("Failed to save analyzed move:", error);
    return { success: false, error: "Failed to save analyzed move." };
  }
}

/**
 * Fetches all analyzed moves (mistakes, blunders, inaccuracies) for a given game.
 */
export async function getAnalyzedMovesAction(gameId: string) {
  try {
    const moves = await prisma.analyzedMove.findMany({
      where: { gameId },
    });
    return { success: true, moves };
  } catch (error) {
    console.error("Failed to fetch analyzed moves:", error);
    return { success: false, error: "Failed to fetch analyzed moves." };
  }
}

/**
 * Saves a user's reflection to a specific analyzed move (mistake/blunder).
 */
export async function saveReflectionAction(moveId: string, reflection: string) {
  try {
    const updated = await prisma.analyzedMove.update({
      where: { id: moveId },
      data: { humanReflection: reflection },
    });
    return { success: true, move: updated };
  } catch (error) {
    console.error("Failed to save reflection:", error);
    return { success: false, error: "Failed to save reflection." };
  }
}

/**
 * Fetches all games saved by the user.
 */
export async function getGamesAction() {
  try {
    const games = await prisma.game.findMany({
      orderBy: { createdAt: "desc" },
    });
    return { success: true, games };
  } catch (error) {
    console.error("Failed to fetch games:", error);
    return { success: false, error: "Failed to fetch games." };
  }
}

/**
 * Fetches a specific game by ID.
 */
export async function getGameByIdAction(id: string) {
  try {
    const game = await prisma.game.findUnique({
      where: { id },
    });
    return { success: true, game };
  } catch (error) {
    console.error("Failed to fetch game:", error);
    return { success: false, error: "Failed to fetch game." };
  }
}
