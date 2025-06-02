import Phaser from "phaser";
import { generateBoard, ROWS, COLS } from "./rng";
import { findMatchGroups } from "./FloodFill";
import { clearMatches, applyTumble } from "./TumbleUtils";
import { calculateWinnings, BASE_BET } from "./Payout";
import {
  injectMultipliersIntoBoard,
  isMultiplierString,
  parseMultiplierValue,
} from "./MultiplierManager";
import type { Position } from "./FloodFill";

export class GameScene extends Phaser.Scene {
  private board: string[][] = [];
  private symbolTexts: Phaser.GameObjects.Text[][] = [];
  private spinButton!: Phaser.GameObjects.Text;
  private winningsText!: Phaser.GameObjects.Text;
  private multiplierInfoText!: Phaser.GameObjects.Text;
  private balanceText!: Phaser.GameObjects.Text;
  private headerContainer!: Phaser.GameObjects.Container;

  private boardBorder!: Phaser.GameObjects.Graphics;
  private winTableBorder!: Phaser.GameObjects.Graphics;

  private winTableText: Phaser.GameObjects.Text[] = [];
  private winTierText!: Phaser.GameObjects.Text;
  private multiplierTexts: Phaser.GameObjects.Text[] = [];
  private winTierTextBackground!: Phaser.GameObjects.Graphics;

  private totalWinnings = 0;
  private baseWinnings = 0;
  private balance = 100.0;
  private allWinGroups: { symbol: string; count: number; payout: number }[] =
    [];

  private readonly cellSize = 72;
  private readonly offsetX = 100;
  private readonly offsetY = 100;

  create() {
    this.createUI();
    this.resetGame();
  }

  createUI() {
    const boardWidth = COLS * this.cellSize;
    const boardHeight = ROWS * this.cellSize;
    const boardRight = this.offsetX + boardWidth;

    this.boardBorder = this.add.graphics();
    this.boardBorder.lineStyle(3, 0xffffff);
    this.boardBorder.strokeRect(
      this.offsetX,
      this.offsetY,
      boardWidth,
      boardHeight
    );

    for (let row = 0; row < ROWS; row++) {
      this.symbolTexts[row] = [];
      for (let col = 0; col < COLS; col++) {
        const x = this.offsetX + col * this.cellSize + this.cellSize / 2;
        const y = this.offsetY + row * this.cellSize + this.cellSize / 2;

        const text = this.add
          .text(x, y, "", {
            fontSize: "56px",
            color: "#fff",
            padding: { top: 10, bottom: 10 },
          })
          .setOrigin(0.5);

        const bg = this.add.graphics();
        bg.lineStyle(4, 0xffd700, 0);
        bg.strokeRect(
          x - this.cellSize / 2,
          y - this.cellSize / 2,
          this.cellSize,
          this.cellSize
        );

        (text as any).bg = bg;
        this.symbolTexts[row][col] = text;
      }
    }

    const tableX = boardRight + 20;
    const tableY = this.offsetY;
    const tableWidth = 200;
    const tableHeight = ROWS * this.cellSize;

    this.winTableBorder = this.add.graphics();
    this.winTableBorder.lineStyle(2, 0xffff00);
    this.winTableBorder.strokeRect(tableX, tableY, tableWidth, tableHeight);

    for (let i = 0; i < 15; i++) {
      const line = this.add.text(tableX + 10, tableY + 10 + i * 22, "", {
        fontSize: "18px",
        color: "#ff0",
      });
      this.winTableText.push(line);
    }

    const centerX = this.offsetX + boardWidth / 2;

    this.spinButton = this.add
      .text(centerX, this.offsetY + boardHeight + 30, "SPIN", {
        fontSize: "32px",
        backgroundColor: "#444",
        padding: { x: 20, y: 10 },
      })
      .setOrigin(0.5)
      .setInteractive()
      .on("pointerdown", () => this.handleSpin());

    this.winningsText = this.add.text(0, 0, "Winnings: €0.00", {
      fontSize: "24px",
      color: "#fff",
    });

    this.multiplierInfoText = this.add.text(0, 0, "", {
      fontSize: "24px",
      color: "#1aff87",
    });

    this.balanceText = this.add.text(0, 0, "Balance: €100.00", {
      fontSize: "24px",
      color: "#fff",
    });

    this.headerContainer = this.add.container(
      centerX - 150,
      this.spinButton.y + 50,
      [this.winningsText, this.multiplierInfoText, this.balanceText]
    );
    this.layoutHeader();

    this.winTierTextBackground = this.add.graphics().setAlpha(0);

    this.winTierText = this.add
      .text(centerX, this.offsetY + boardHeight / 2, "", {
        fontSize: "64px",
        color: "#ffd700",
        stroke: "#fff",
        strokeThickness: 6,
      })
      .setOrigin(0.5)
      .setAlpha(0)
      .setDepth(10);
  }

  layoutHeader() {
    const spacing = 20;
    this.winningsText.setX(0);
    this.multiplierInfoText.setX(this.winningsText.width + spacing);
    this.balanceText.setX(
      this.multiplierInfoText.x + this.multiplierInfoText.width + spacing
    );
  }

  resetGame() {
    this.board = generateBoard();
    this.totalWinnings = 0;
    this.baseWinnings = 0;
    this.allWinGroups = [];
    this.updateBoardDisplay();
    this.updateUI();
    this.clearWinTable();
    this.clearMultiplierTexts();
  }

  handleSpin() {
    if (this.balance < BASE_BET) return;

    this.spinButton.disableInteractive();
    this.board = generateBoard();
    this.totalWinnings = 0;
    this.baseWinnings = 0;
    this.balance -= BASE_BET;
    this.allWinGroups = [];
    this.updateBoardDisplay();
    this.updateUI();
    this.clearWinTable();
    this.clearMultiplierTexts();

    this.animateInitialDrop(() => {
      this.time.delayedCall(200, () => this.processMatches());
    });
  }

  processMatches() {
    const pureBoard = this.getPureSymbolBoard();
    const groups = findMatchGroups(pureBoard);
    this.highlightWinningSymbols(groups);

    this.time.delayedCall(300, () => {
      if (groups.length === 0) {
        const multiplier = this.getTotalMultiplier();
        if (this.baseWinnings > 0 && multiplier > 0) {
          this.animateMultiplierCollection(() => {
            this.totalWinnings = this.baseWinnings * multiplier;
            this.balance += this.totalWinnings;
            this.updateUI(true, multiplier);
            this.showWinTierIfNeeded();
            this.spinButton.setInteractive();
          });
        } else {
          this.totalWinnings = this.baseWinnings;
          this.balance += this.totalWinnings;
          this.updateUI();
          this.showWinTierIfNeeded();
          this.spinButton.setInteractive();
        }
        return;
      }

      for (const group of groups) {
        for (const { row, col } of group) {
          const text = this.symbolTexts[row][col];
          const bg = (text as any).bg as Phaser.GameObjects.Graphics;
          bg.clear();

          this.tweens.add({
            targets: text,
            alpha: 0,
            duration: 300,
            ease: "Cubic.easeOut",
          });
        }
      }

      this.time.delayedCall(400, () => {
        for (const group of groups) {
          const symbol = this.board[group[0].row][group[0].col];
          const count = group.length;
          const payout = calculateWinnings([group], pureBoard);
          if (payout > 0) {
            this.baseWinnings += payout;
            this.allWinGroups.push({ symbol, count, payout });
          }
        }

        clearMatches(this.board, groups);
        this.clearClearedSymbols(groups);
        this.updateUI();

        this.time.delayedCall(400, () => {
          const moves = applyTumble(this.board);

          // Inject into cells that were filled during tumble
          const newSymbols = moves.map((m) => ({ row: m.toRow, col: m.col }));
          injectMultipliersIntoBoard(this.board, newSymbols);

          this.updateBoardDisplay();
          this.animateTumble(moves);
          this.time.delayedCall(800, () => this.processMatches());
        });
      });
    });
  }

  animateMultiplierCollection(onComplete: () => void) {
    const animations: Phaser.Tweens.Tween[] = [];

    const targetGlobal = this.headerContainer.getBounds();
    const targetX = targetGlobal.centerX;
    const targetY = targetGlobal.centerY;

    for (let row = 0; row < ROWS; row++) {
      for (let col = 0; col < COLS; col++) {
        const cell = this.board[row][col];
        if (!isMultiplierString(cell)) continue;

        const value = parseMultiplierValue(cell);
        const x = this.offsetX + col * this.cellSize + this.cellSize / 2;
        const y = this.offsetY + row * this.cellSize + this.cellSize / 2;

        const fly = this.add
          .text(x, y, `${value}x`, {
            backgroundColor: "#1aff87",
            padding: { x: 4, y: 2 },
          })
          .setOrigin(0.5);

        this.multiplierTexts.push(fly);

        animations.push(
          this.tweens.add({
            targets: fly,
            x: targetX,
            y: targetY,
            alpha: 0,
            duration: 700,
            ease: "Cubic.easeInOut",
          })
        );
      }
    }

    if (animations.length === 0) {
      onComplete();
    } else {
      this.time.delayedCall(750, () => {
        this.clearMultiplierTexts();
        onComplete();
      });
    }
  }

  getTotalMultiplier(): number {
    return this.board
      .flat()
      .reduce(
        (sum, cell) =>
          isMultiplierString(cell) ? sum + parseMultiplierValue(cell) : sum,
        0
      );
  }

  getPureSymbolBoard(): string[][] {
    return this.board.map((row) =>
      row.map((cell) => (isMultiplierString(cell) ? "" : cell))
    );
  }

  updateBoardDisplay() {
    for (let row = 0; row < ROWS; row++) {
      for (let col = 0; col < COLS; col++) {
        const cell = this.board[row][col];
        const text = this.symbolTexts[row][col];
        if (isMultiplierString(cell)) {
          const value = parseMultiplierValue(cell);
          text.setText(`${value}x`);
          text.setFontSize(value >= 100 ? 28 : value >= 10 ? 32 : 36);
        } else {
          text.setText(cell);
          text.setFontSize(56);
        }

        text.setAlpha(1);
      }
    }
  }

  animateTumble(moves: { fromRow: number; toRow: number; col: number }[]) {
    for (const { fromRow, toRow, col } of moves) {
      const text = this.symbolTexts[toRow][col];
      const startY =
        this.offsetY +
        (fromRow === -1
          ? toRow * this.cellSize - 200
          : fromRow * this.cellSize) +
        this.cellSize / 2;
      const endY = this.offsetY + toRow * this.cellSize + this.cellSize / 2;

      text.y = startY;
      this.tweens.add({
        targets: text,
        y: endY,
        duration: 300,
        ease: "Bounce.Out",
      });
    }
  }

  clearMultiplierTexts() {
    for (const t of this.multiplierTexts) t.destroy();
    this.multiplierTexts = [];
  }

  clearClearedSymbols(groups: Position[][]) {
    for (const group of groups) {
      for (const { row, col } of group) {
        this.symbolTexts[row][col].setText("");
      }
    }
  }

  showWinTierIfNeeded() {
    const win = this.totalWinnings;
    if (win >= 20) this.showWinTier("SENSATIONAL", win);
    else if (win >= 10) this.showWinTier("MEGA WIN", win);
    else if (win >= 5) this.showWinTier("BIG WIN", win);
  }

  showWinTier(label: string, amount: number) {
    const padding = 20;
    this.winTierText.setText(`${label}\n€0.00`).setScale(0.5).setAlpha(1);

    const bounds = this.winTierText.getBounds();
    this.winTierTextBackground
      .clear()
      .fillStyle(0x000000, 0.7)
      .fillRoundedRect(
        bounds.x - padding,
        bounds.y - padding,
        bounds.width + padding * 2,
        bounds.height + padding * 2,
        10
      )
      .setAlpha(1);

    this.tweens.add({
      targets: this.winTierText,
      scale: 1.2,
      duration: 300,
      ease: "Back.Out",
      yoyo: true,
    });

    let displayed = 0;
    const duration = Phaser.Math.Clamp(amount * 100, 500, 3000);
    const steps = 30;
    let step = 0;

    this.time.addEvent({
      delay: duration / steps,
      repeat: steps - 1,
      callback: () => {
        step++;
        const progress = step / steps;
        displayed = Phaser.Math.Interpolation.Linear([0, amount], progress);
        this.winTierText.setText(`${label}\n€${displayed.toFixed(2)}`);

        if (step === steps) {
          this.winTierText.setText(`${label}\n€${amount.toFixed(2)}`);
          this.tweens.add({
            targets: [this.winTierText, this.winTierTextBackground],
            alpha: 0,
            duration: 800,
            delay: 500,
          });
        }
      },
      callbackScope: this,
    });
  }

  updateUI(showMultiplier = false, multiplier = 1) {
    this.winningsText.setText(`Winnings: €${this.baseWinnings.toFixed(2)}`);
    this.multiplierInfoText.setText(
      showMultiplier
        ? ` x ${multiplier} = €${this.totalWinnings.toFixed(2)}`
        : ""
    );
    this.balanceText.setText(`Balance: €${this.balance.toFixed(2)}`);
    this.layoutHeader();
    this.updateWinTableUI();
  }

  clearWinTable() {
    this.winTableText.forEach((t) => t.setText(""));
  }

  updateWinTableUI() {
    const lines = this.allWinGroups.map(
      (entry) => `${entry.symbol} x${entry.count} = €${entry.payout.toFixed(2)}`
    );
    lines.slice(0, this.winTableText.length).forEach((line, i) => {
      this.winTableText[i].setText(line);
    });
  }

  highlightWinningSymbols(groups: Position[][]) {
    for (const group of groups) {
      if (group.length < 8) continue;

      for (const { row, col } of group) {
        const text = this.symbolTexts[row][col];
        const bg = (text as any).bg as Phaser.GameObjects.Graphics;

        bg.clear();
        bg.lineStyle(4, 0xffd700, 1);
        bg.strokeRect(
          text.x - this.cellSize / 2,
          text.y - this.cellSize / 2,
          this.cellSize,
          this.cellSize
        );

        this.tweens.add({
          targets: text,
          x: text.x + 2,
          duration: 60,
          ease: "Sine.easeInOut",
          yoyo: true,
          repeat: 3,
        });
      }
    }
  }

  animateInitialDrop(onComplete: () => void) {
    for (let row = 0; row < ROWS; row++) {
      for (let col = 0; col < COLS; col++) {
        const text = this.symbolTexts[row][col];
        const targetY = this.offsetY + row * this.cellSize + this.cellSize / 2;
        text.y = targetY - 300;

        this.tweens.add({
          targets: text,
          y: targetY,
          duration: 400,
          delay: col * 40,
          ease: "Bounce.Out",
        });
      }
    }

    this.time.delayedCall(600, () => onComplete());
  }
}
