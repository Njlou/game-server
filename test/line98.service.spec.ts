import { Test } from '@nestjs/testing';
import { Line98Service } from '../src/games/line98/line98.service';
import { CaroService } from '../src/games/caro/caro.service';

describe('Line98Service', () => {
    let service: Line98Service;

    beforeEach(async () => {
        const moduleRef = await Test.createTestingModule({
            providers: [Line98Service],
        }).compile();

        service = moduleRef.get<Line98Service>(Line98Service);
    });

    describe('createNewGame', () => {
        it('should create a new game with correct structure', () => {
            const gameState = service.createNewGame();

            expect(gameState.grid).toHaveLength(9);
            expect(gameState.grid[0]).toHaveLength(9);
            expect(gameState.score).toBe(0);
            expect(gameState.selectedBall).toBeNull();
            expect(gameState.gameOver).toBe(false);
        });

        it('should have initial balls placed', () => {
            const gameState = service.createNewGame();
            const ballCount = gameState.grid.flat().filter(cell => cell !== -1).length;

            expect(ballCount).toBe(5);
        });
    });

    describe('moveBall', () => {
        it('should move ball to empty cell', () => {
            const grid = [
                [0, -1, -1],
                [-1, -1, -1],
                [-1, -1, -1]
            ];

            const result = service.moveBall(grid, 0, 0, 0, 1);

            expect(result).toBe(true);
            expect(grid[0][0]).toBe(-1);
            expect(grid[0][1]).toBe(0);
        });

        it('should not move ball to occupied cell', () => {
            const grid = [
                [0, 1, -1],
                [-1, -1, -1],
                [-1, -1, -1]
            ];

            const result = service.moveBall(grid, 0, 0, 0, 1);

            expect(result).toBe(false);
            expect(grid[0][0]).toBe(0);
            expect(grid[0][1]).toBe(1);
        });
    });
});


describe('CaroService', () => {
    let service: CaroService;

    beforeEach(async () => {
        const moduleRef = await Test.createTestingModule({
            providers: [CaroService],
        }).compile();

        service = moduleRef.get<CaroService>(CaroService);
    });

    describe('createNewGame', () => {
        it('should create a new game with empty board', () => {
            const gameState = service.createNewGame();

            expect(gameState.board).toHaveLength(15);
            expect(gameState.board[0]).toHaveLength(15);
            expect(gameState.currentPlayer).toBe(1);
            expect(gameState.winner).toBe(0);
            expect(gameState.gameOver).toBe(false);
        });
    });

    describe('makeMove', () => {
        it('should allow valid move', () => {
            const gameState = service.createNewGame();
            const result = service.makeMove(gameState, 0, 0, 1);

            expect(result).toBe(true);
            expect(gameState.board[0][0]).toBe(1);
            expect(gameState.currentPlayer).toBe(2);
        });

        it('should detect win condition', () => {
            const gameState = service.createNewGame();

            // Create a winning sequence for player 1
            service.makeMove(gameState, 0, 0, 1);
            service.makeMove(gameState, 1, 0, 2);
            service.makeMove(gameState, 0, 1, 1);
            service.makeMove(gameState, 1, 1, 2);
            service.makeMove(gameState, 0, 2, 1);
            service.makeMove(gameState, 1, 2, 2);
            service.makeMove(gameState, 0, 3, 1);
            service.makeMove(gameState, 1, 3, 2);
            const winningMove = service.makeMove(gameState, 0, 4, 1);

            expect(winningMove).toBe(true);
            expect(gameState.winner).toBe(1);
            expect(gameState.gameOver).toBe(true);
        });
    });
});