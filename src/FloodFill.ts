export type Position = { row: number; col: number };

export function floodFill(
  board: string[][],
  visited: boolean[][],
  startRow: number,
  startCol: number,
  symbol: string
): Position[] {
  const stack: Position[] = [{ row: startRow, col: startCol }];
  const cluster: Position[] = [];

  while (stack.length > 0) {
    const current = stack.pop();
    if (!current) continue;

    const { row, col } = current;
    if (
      row < 0 ||
      row >= board.length ||
      col < 0 ||
      col >= board[0].length ||
      visited[row][col] ||
      board[row][col] !== symbol
    ) {
      continue;
    }

    visited[row][col] = true;
    cluster.push({ row, col });

    stack.push({ row: row + 1, col: col });
    stack.push({ row: row - 1, col: col });
    stack.push({ row: row, col: col + 1 });
    stack.push({ row: row, col: col - 1 });
  }

  return cluster;
}

export function findMatchGroups(board: string[][]): Position[][] {
  const symbolMap = new Map<string, Position[]>();

  for (let row = 0; row < board.length; row++) {
    for (let col = 0; col < board[0].length; col++) {
      const symbol = board[row][col];
      if (!symbolMap.has(symbol)) {
        symbolMap.set(symbol, []);
      }
      symbolMap.get(symbol)!.push({ row, col });
    }
  }

  const result: Position[][] = [];

  for (const [, positions] of symbolMap.entries()) {
    if (positions.length >= 8) {
      result.push(positions);
    }
  }

  return result;
}
