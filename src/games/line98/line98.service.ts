import { Injectable } from '@nestjs/common';

export interface Line98GameState {
    grid: number[][];
    score: number;
    selectedBall: { row: number; col: number } | null;
    gameOver: boolean;
}

@Injectable()
export class Line98Service {
    private readonly GRID_SIZE = 9;
    private readonly COLORS = 5;
    private readonly MIN_MATCH = 5;

    createNewGame(): Line98GameState {
        const grid = this.generateInitialGrid();
        return {
            grid,
            score: 0,
            selectedBall: null,
            gameOver: false,
        };
    }

    private generateInitialGrid(): number[][] {
        const grid = Array(this.GRID_SIZE).fill(0).map(() =>
            Array(this.GRID_SIZE).fill(-1)
        );

        // Add 5 initial balls
        for (let i = 0; i < 5; i++) {
            this.addRandomBall(grid);
        }

        return grid;
    }

    addRandomBall(grid: number[][]): boolean {
        const emptyCells: { row: number; col: number }[] = [];
        for (let i = 0; i < this.GRID_SIZE; i++) {
            for (let j = 0; j < this.GRID_SIZE; j++) {
                if (grid[i][j] === -1) {
                    emptyCells.push({ row: i, col: j });
                }
            }
        }

        if (emptyCells.length === 0) {
            return false;
        }

        const randomCell = emptyCells[Math.floor(Math.random() * emptyCells.length)];
        grid[randomCell.row][randomCell.col] = Math.floor(Math.random() * this.COLORS);
        return true;
    }

    selectBall(grid: number[][], row: number, col: number): boolean {
        return grid[row][col] !== -1;
    }

    moveBall(grid: number[][], fromRow: number, fromCol: number, toRow: number, toCol: number): boolean {
        if (grid[toRow][toCol] !== -1) {
            return false; // Target cell is not empty
        }

        // Simple move - just swap positions for demo
        grid[toRow][toCol] = grid[fromRow][fromCol];
        grid[fromRow][fromCol] = -1;

        return true;
    }

    checkMatches(grid: number[][]): number {
        let matchesFound = 0;

        // Check horizontal matches
        for (let row = 0; row < this.GRID_SIZE; row++) {
            for (let col = 0; col <= this.GRID_SIZE - this.MIN_MATCH; col++) {
                const color = grid[row][col];
                if (color === -1) continue;

                let matchLength = 1;
                while (col + matchLength < this.GRID_SIZE && grid[row][col + matchLength] === color) {
                    matchLength++;
                }

                if (matchLength >= this.MIN_MATCH) {
                    for (let i = 0; i < matchLength; i++) {
                        grid[row][col + i] = -1;
                    }
                    matchesFound += matchLength;
                }
            }
        }

        // Similar checks for vertical and diagonal would be implemented
        return matchesFound;
    }

    getHint(grid: number[][]): { from: { row: number; col: number }; to: { row: number; col: number } } | null {
        // Simple hint: find first possible move
        for (let row = 0; row < this.GRID_SIZE; row++) {
            for (let col = 0; col < this.GRID_SIZE; col++) {
                if (grid[row][col] !== -1) {
                    // Check adjacent empty cells
                    const directions = [[-1, 0], [1, 0], [0, -1], [0, 1]];
                    for (const [dr, dc] of directions) {
                        const newRow = row + dr;
                        const newCol = col + dc;
                        if (newRow >= 0 && newRow < this.GRID_SIZE && newCol >= 0 && newCol < this.GRID_SIZE) {
                            if (grid[newRow][newCol] === -1) {
                                return {
                                    from: { row, col },
                                    to: { row: newRow, col: newCol }
                                };
                            }
                        }
                    }
                }
            }
        }
        return null;
    }
}