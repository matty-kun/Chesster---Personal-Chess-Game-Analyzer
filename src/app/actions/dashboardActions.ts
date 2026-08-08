"use server";

import prisma from "@/lib/prisma";

export async function getDashboardStatsAction() {
  try {
    // Total games played/uploaded (excluding sample game)
    const totalGames = await prisma.game.count({
      where: {
        NOT: { event: { contains: "Kasparov vs. Deep Blue Rematch" } }
      }
    });

    // All analyzed moves (excluding sample game)
    const analyzedMoves = await prisma.analyzedMove.findMany({
      where: {
        game: {
          NOT: { event: { contains: "Kasparov vs. Deep Blue Rematch" } }
        }
      },
      include: {
        game: {
          select: { date: true, pgn: true }
        }
      },
      orderBy: { createdAt: 'asc' }
    });

    // Aggregate Mistake Types
    let totalBlunders = 0;
    let totalMistakes = 0;
    let totalInaccuracies = 0;

    // Accuracy Trend (group by Game)
    // To keep it simple, we'll map each game to its average evaluation drop or mistake count
    const gameMistakesMap: Record<string, { blunders: number, date: Date | null }> = {};

    // Game Phase Aggregation (for AI Coach)
    let openingMistakes = 0; // Moves 1-12
    let middlegameMistakes = 0; // Moves 13-30
    let endgameMistakes = 0; // Moves 31+
    let totalBlundersCountForCoach = 0;

    analyzedMoves.forEach(move => {
      // General stats
      if (move.classification === "Blunder") totalBlunders++;
      if (move.classification === "Mistake") totalMistakes++;
      if (move.classification === "Inaccuracy") totalInaccuracies++;

      // Accuracy Trend
      if (!gameMistakesMap[move.gameId]) {
        gameMistakesMap[move.gameId] = { blunders: 0, date: move.game.date || move.createdAt };
      }
      if (move.classification === "Blunder") {
        gameMistakesMap[move.gameId].blunders++;
        totalBlundersCountForCoach++;

        // Phase aggregation (only counting actual mistakes/blunders for coach)
        // Note: moveNumber in chess is typically full moves (1 white, 1 black = move 1)
        // If moveNumber is stored as half-moves (ply), we divide by 2. Assuming full moves:
        const moveNum = move.moveNumber;
        if (moveNum <= 12) openingMistakes++;
        else if (moveNum <= 30) middlegameMistakes++;
        else endgameMistakes++;
      }
      // Also count regular mistakes toward the coach phase analysis to get more data
      else if (move.classification === "Mistake") {
        const moveNum = move.moveNumber;
        if (moveNum <= 12) openingMistakes++;
        else if (moveNum <= 30) middlegameMistakes++;
        else endgameMistakes++;
      }
    });

    // AI Coach Rule Engine
    const totalCoachMistakes = openingMistakes + middlegameMistakes + endgameMistakes;
    let recommendation = null;

    if (totalCoachMistakes > 0) {
      if (openingMistakes / totalCoachMistakes >= 0.4) {
        recommendation = {
          weakestPhase: "Opening",
          advice: "You are making a disproportionate amount of early mistakes. Focus on studying opening principles, developing your pieces safely, and watching out for early tactical traps.",
        };
      } else if (endgameMistakes / totalCoachMistakes >= 0.35) {
        recommendation = {
          weakestPhase: "Endgame",
          advice: "Your games are slipping away in the final phase. Dedicate time to studying basic endgame checkmates and standard pawn structures.",
        };
      } else {
        recommendation = {
          weakestPhase: "Middlegame",
          advice: "Your openings are solid, but you are dropping the ball in the complex middlegame. Focus your training on calculation, tactical puzzles, and middle-game plans.",
        };
      }
    } else {
       recommendation = {
          weakestPhase: "None (Not Enough Data)",
          advice: "Play and analyze a game with blunders or mistakes so I can recommend a study plan!",
       };
    }

    // Format for charts
    const breakdownData = [
      { name: "Blunders", value: totalBlunders, fill: "#ff5555" },
      { name: "Mistakes", value: totalMistakes, fill: "#ffb86c" },
      { name: "Inaccuracies", value: totalInaccuracies, fill: "#f1fa8c" },
    ];

    const trendData = Object.values(gameMistakesMap)
      .sort((a, b) => {
        if (!a.date || !b.date) return 0;
        return a.date.getTime() - b.date.getTime();
      })
      .map((g, i) => ({
        name: `Game ${i + 1}`,
        blunders: g.blunders
      }))
      .slice(-10); // Last 10 games

    // Recent Reflections (Moves with a humanReflection)
    const recentReflections = analyzedMoves
      .filter(m => m.humanReflection && m.humanReflection.trim().length > 0)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, 5)
      .map(m => ({
        id: m.id,
        classification: m.classification,
        reflection: m.humanReflection,
        moveSan: m.playedMoveSan,
        date: m.createdAt.toLocaleDateString(),
      }));

    return {
      success: true,
      stats: {
        totalGames,
        totalAnalyzedMoves: analyzedMoves.length,
        breakdownData,
        trendData,
        recommendation,
        recentReflections
      }
    };
  } catch (error) {
    console.error("Failed to fetch dashboard stats:", error);
    return { success: false, error: "Failed to fetch stats." };
  }
}
