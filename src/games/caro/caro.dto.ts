// Data transfer objects for Caro game

export class MakeMoveDto {
    row: number;
    col: number;
    player: number;
}

export class JoinQueueDto {
    playerId: string;
}

export class GameStateDto {
    gameId: string;
    board: number[][];
    currentPlayer: number;
    winner: number;
    gameOver: boolean;
}