import { randomSymbol } from "./rng";

export interface TumbleMove {
  fromRow: number;
  toRow: number;
  col: number;
}

export function applyTumble(board: string[][]): TumbleMove[] {
  const rows = board.length;
  const cols = board[0].length;
  const moves: TumbleMove[] = [];

  for (let col = 0; col < cols; col++) {
    let emptyRow = rows - 1;

    for (let row = rows - 1; row >= 0; row--) {
      if (board[row][col] !== "") {
        if (emptyRow !== row) {
          board[emptyRow][col] = board[row][col];
          board[row][col] = "";
          moves.push({ fromRow: row, toRow: emptyRow, col });
        }
        emptyRow--;
      }
    }

    for (let row = emptyRow; row >= 0; row--) {
      board[row][col] = randomSymbol();
      moves.push({ fromRow: -1, toRow: row, col });
    }
  }

  return moves;
}

export function clearMatches(
  board: string[][],
  matches: { row: number; col: number }[][]
): void {
  for (const group of matches) {
    for (const { row, col } of group) {
      board[row][col] = "";
    }
  }
}
