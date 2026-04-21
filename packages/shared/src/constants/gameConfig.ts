export const GAME_CONFIG = {
  eliminationRisk: {
    baseChance: 0.3,
    increasePerWrong: 0.05,
    maxChance: 0.75,
  },
  round: {
    questionTimeSeconds: 12,
    voteTimeSeconds: 8,
  },
  room: {
    minPlayers: 2,
    maxPlayers: 8,
    rankedMinPlayers: 2,
    rankedMaxPlayers: 4,
  },
  reconnectGraceSeconds: 30,
} as const;
