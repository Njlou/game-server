import { Injectable } from '@nestjs/common';

// Game state interface
export interface CaroGameState {
    board: number[][]; // 0 = empty, 1 = player1 (X), 2 = player2 (O)
    currentPlayer: number;
    winner: number;
    gameOver: boolean;
    lastMove: { row: number; col: number } | null;
}

// Data transfer object for making moves
export class MakeMoveDto {
    row: number;
    col: number;
    player: number;
}

@Injectable()
export class CaroService {
    private readonly BOARD_SIZE = 15;
    private readonly WIN_COUNT = 5;
    private readonly EMPTY = 0;
    private readonly PLAYER1 = 1;
    private readonly PLAYER2 = 2;

    // Create new game state
    createNewGame(): CaroGameState {
        const board = Array(this.BOARD_SIZE).fill(0).map(() =>
            Array(this.BOARD_SIZE).fill(this.EMPTY)
        );

        return {
            board,
            currentPlayer: this.PLAYER1,
            winner: this.EMPTY,
            gameOver: false,
            lastMove: null,
        };
    }

    // Make a move on the board
    makeMove(state: CaroGameState, row: number, col: number, player: number): { success: boolean; message?: string } {
        // Check if game is over
        if (state.gameOver) {
            return { success: false, message: 'Game is already over' };
        }

        // Check if it's player's turn
        if (state.currentPlayer !== player) {
            return { success: false, message: 'Not your turn' };
        }

        // Validate coordinates
        if (row < 0 || row >= this.BOARD_SIZE || col < 0 || col >= this.BOARD_SIZE) {
            return { success: false, message: 'Invalid coordinates' };
        }

        // Check if cell is empty
        if (state.board[row][col] !== this.EMPTY) {
            return { success: false, message: 'Cell already occupied' };
        }

        // Place the piece
        state.board[row][col] = player;
        state.lastMove = { row, col };

        // Check for win
        if (this.checkWin(state.board, row, col, player)) {
            state.winner = player;
            state.gameOver = true;
            return { success: true, message: `Player ${player} wins!` };
        }

        // Check for draw
        if (this.isBoardFull(state.board)) {
            state.gameOver = true;
            return { success: true, message: 'Game ended in draw' };
        }

        // Switch to next player
        state.currentPlayer = state.currentPlayer === this.PLAYER1 ? this.PLAYER2 : this.PLAYER1;
        return { success: true };
    }

    // Check if a move results in a win
    private checkWin(board: number[][], row: number, col: number, player: number): boolean {
        const directions = [
            [0, 1],   // horizontal
            [1, 0],   // vertical
            [1, 1],   // diagonal \
            [1, -1]   // diagonal /
        ];

        for (const [dr, dc] of directions) {
            let count = 1;

            // Check positive direction
            for (let i = 1; i < this.WIN_COUNT; i++) {
                const newRow = row + dr * i;
                const newCol = col + dc * i;
                if (newRow < 0 || newRow >= this.BOARD_SIZE || newCol < 0 || newCol >= this.BOARD_SIZE) break;
                if (board[newRow][newCol] !== player) break;
                count++;
            }

            // Check negative direction
            for (let i = 1; i < this.WIN_COUNT; i++) {
                const newRow = row - dr * i;
                const newCol = col - dc * i;
                if (newRow < 0 || newRow >= this.BOARD_SIZE || newCol < 0 || newCol >= this.BOARD_SIZE) break;
                if (board[newRow][newCol] !== player) break;
                count++;
            }

            if (count >= this.WIN_COUNT) {
                return true;
            }
        }

        return false;
    }

    // Check if board is full (draw)
    private isBoardFull(board: number[][]): boolean {
        for (let row = 0; row < this.BOARD_SIZE; row++) {
            for (let col = 0; col < this.BOARD_SIZE; col++) {
                if (board[row][col] === this.EMPTY) {
                    return false;
                }
            }
        }
        return true;
    }

    // Get a random valid move (for AI or hints)
    getRandomMove(board: number[][]): { row: number; col: number } {
        const emptyCells: { row: number; col: number }[] = [];

        for (let row = 0; row < this.BOARD_SIZE; row++) {
            for (let col = 0; col < this.BOARD_SIZE; col++) {
                if (board[row][col] === this.EMPTY) {
                    emptyCells.push({ row, col });
                }
            }
        }

        if (emptyCells.length === 0) {
            return { row: -1, col: -1 };
        }

        return emptyCells[Math.floor(Math.random() * emptyCells.length)];
    }

    // Get game status
    getGameStatus(state: CaroGameState): string {
        if (state.gameOver) {
            if (state.winner !== this.EMPTY) {
                return `Player ${state.winner} wins!`;
            } else {
                return 'Game ended in draw';
            }
        } else {
            return `Player ${state.currentPlayer}'s turn`;
        }
    }
}