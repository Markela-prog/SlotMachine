import { injectMultipliersIntoBoard } from "./MultiplierManager";

// Updated to match payoutTable symbols and structure
const SYMBOLS: { symbol: string; weight: number }[] = [
  { symbol: "👑", weight: 2 }, // Crown
  { symbol: "⏳", weight: 3 }, // Hourglass
  { symbol: "💍", weight: 4 }, // Ring
  { symbol: "🏆", weight: 4 }, // Chalice
  { symbol: "🔶", weight: 6 }, // Red Gem
  { symbol: "💜", weight: 6 }, // Purple Gem
  { symbol: "💛", weight: 8 }, // Yellow Gem
  { symbol: "💚", weight: 8 }, // Green Gem
  { symbol: "🔷", weight: 10 }, // Blue Gem
];

export const ROWS = 5;
export const COLS = 6;

function buildWeightedPool(): string[] {
  const pool: string[] = [];
  for (const { symbol, weight } of SYMBOLS) {
    for (let i = 0; i < weight; i++) {
      pool.push(symbol);
    }
  }
  return pool;
}

const weightedPool = buildWeightedPool();

export function randomSymbol(): string {
  const index = Math.floor(Math.random() * weightedPool.length);
  return weightedPool[index];
}

export function generateBoard(
  rows: number = ROWS,
  cols: number = COLS
): string[][] {
  const board: string[][] = [];
  for (let row = 0; row < rows; row++) {
    const rowArr: string[] = [];
    for (let col = 0; col < cols; col++) {
      rowArr.push(randomSymbol());
    }
    board.push(rowArr);
  }

  injectMultipliersIntoBoard(board);
  return board;
}

export function cloneBoard(board: string[][]): string[][] {
  return board.map((row) => [...row]);
}

export function getSymbolAt(
  board: string[][],
  row: number,
  col: number
): string | null {
  if (row < 0 || row >= board.length || col < 0 || col >= board[0].length)
    return null;
  return board[row][col];
}
