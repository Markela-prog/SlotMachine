import type { Position } from "./FloodFill";

export const BASE_BET = 0.2;

// Direct euro payouts (not multipliers)
const payoutTable: Record<string, [number, number, number]> = {
  "👑": [2.0, 5.0, 10.0], // Crown
  "⏳": [0.5, 2.0, 5.0], // Hourglass
  "💍": [0.4, 1.0, 3.0], // Ring
  "🏆": [0.3, 0.8, 2.4], // Chalice
  "🔶": [0.2, 0.3, 2.0], // Red Gem
  "💜": [0.16, 0.24, 1.6], // Purple Gem
  "💛": [0.1, 0.2, 1.0], // Yellow Gem
  "💚": [0.08, 0.18, 0.8], // Green Gem
  "🔷": [0.05, 0.15, 0.4], // Blue Gem
};

export function getSymbolPayout(symbol: string, count: number): number {
  const [p8, p10, p12] = payoutTable[symbol] ?? [0, 0, 0];
  if (count >= 12) return p12;
  if (count >= 10) return p10;
  if (count >= 8) return p8;
  return 0;
}

export function calculateWinnings(
  groups: Position[][],
  board: string[][]
): number {
  let total = 0;

  for (const group of groups) {
    if (group.length === 0) continue;

    const { row, col } = group[0];
    const symbol = board[row][col];
    const payout = getSymbolPayout(symbol, group.length);
    total += payout;
  }

  return total;
}
