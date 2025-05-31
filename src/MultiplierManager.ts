export interface Multiplier {
  row: number;
  col: number;
  value: number;
  color: string;
}

const TIERS = [
  { color: "green", values: [2, 3, 4, 5, 6, 8], weight: 50 },
  { color: "blue", values: [10, 12, 15, 20, 25], weight: 30 },
  { color: "purple", values: [50], weight: 15 },
  { color: "red", values: [100, 250, 500], weight: 5 },
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

export function injectMultipliersIntoBoard(board: string[][]): Multiplier[] {
  const multipliers: Multiplier[] = [];
  const chance = Math.random();

  // ~25% chance to inject multipliers
  if (chance > 0.25) return multipliers;

  const count = Phaser.Math.Between(1, 2); // Max 2 per spin
  const usedPositions = new Set<string>();

  for (let i = 0; i < count; i++) {
    const tier = getRandomTier();
    const value = Phaser.Utils.Array.GetRandom(tier.values);

    let row: number, col: number;
    do {
      row = Phaser.Math.Between(0, board.length - 1);
      col = Phaser.Math.Between(0, board[0].length - 1);
    } while (usedPositions.has(`${row},${col}`));

    usedPositions.add(`${row},${col}`);
    board[row][col] = `MULTI:${value}`;
    multipliers.push({ row, col, value, color: tier.color });
  }

  return multipliers;
}
