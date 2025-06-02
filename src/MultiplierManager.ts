export interface Multiplier {
  row: number;
  col: number;
  value: number;
  color: string;
}

const TIERS = [
  { color: "green", values: [2, 3, 4, 5, 6, 8], weight: 100 },
  { color: "blue", values: [10, 12, 15, 20, 25], weight: 20 },
  { color: "purple", values: [50], weight: 3 },
  { color: "red", values: [100, 250, 500], weight: 1 },
];

function getRandomTier() {
  const pool: typeof TIERS = [];
  TIERS.forEach((t) => pool.push(...Array(t.weight).fill(t)));
  return Phaser.Utils.Array.GetRandom(pool);
}

export function isMultiplierString(cell: string): boolean {
  return cell.startsWith("MULTI:");
}

export function parseMultiplierValue(cell: string): number {
  return parseInt(cell.split(":")[1]);
}

export function injectMultipliersIntoBoard(
  board: string[][],
  eligiblePositions?: { row: number; col: number }[]
): Multiplier[] {
  const multipliers: Multiplier[] = [];
  const chance = Math.random();

  if (chance > 0.15) return multipliers; 

  // ✅ Filter to only empty and non-multiplier cells
  const candidates = (eligiblePositions ?? getAllPositions(board)).filter(
    ({ row, col }) =>
      board[row][col] !== "" && !isMultiplierString(board[row][col])
  );

  if (candidates.length === 0) return multipliers;

  const count = Phaser.Math.Between(1, Math.min(2, candidates.length));
  const usedIndices = new Set<number>();

  for (let i = 0; i < count; i++) {
    let idx: number;
    do {
      idx = Phaser.Math.Between(0, candidates.length - 1);
    } while (usedIndices.has(idx));

    usedIndices.add(idx);

    const { row, col } = candidates[idx];
    const tier = getRandomTier();
    const value = Phaser.Utils.Array.GetRandom(tier.values);

    board[row][col] = `MULTI:${value}`;
    multipliers.push({ row, col, value, color: tier.color });
  }

  return multipliers;
}

function getAllPositions(board: string[][]): { row: number; col: number }[] {
  const positions: { row: number; col: number }[] = [];
  for (let row = 0; row < board.length; row++) {
    for (let col = 0; col < board[0].length; col++) {
      positions.push({ row, col });
    }
  }
  return positions;
}
