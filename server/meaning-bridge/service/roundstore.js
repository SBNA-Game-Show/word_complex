const globalForRounds = globalThis;

const rounds = globalForRounds.__meaningBridgeRounds || new Map();

globalForRounds.__meaningBridgeRounds = rounds;

function saveRoundFallback(puzzle) {
  rounds.set(puzzle.roundId, {
    roundId: puzzle.roundId,
    puzzle,
    createdAt: new Date().toISOString(),
  });
}

function getRoundFallback(roundId) {
  return rounds.get(roundId) || null;
}

function resetRoundFallbackForTests() {
  rounds.clear();
}

module.exports = {
  saveRoundFallback,
  getRoundFallback,
  resetRoundFallbackForTests,
};
