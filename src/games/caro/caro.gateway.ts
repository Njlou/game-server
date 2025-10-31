import { WebSocketGateway, WebSocketServer, SubscribeMessage, OnGatewayConnection, OnGatewayDisconnect } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Injectable, Logger } from '@nestjs/common';
import { CaroService, CaroGameState, MakeMoveDto } from './caro.service';

// Interface for game session
interface CaroGameSession {
    id: string;
    player1: Socket;
    player2: Socket;
    player1Id: string;
    player2Id: string;
    gameState: CaroGameState;
}

@Injectable()
@WebSocketGateway({
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
})
export class CaroGateway implements OnGatewayConnection, OnGatewayDisconnect {
    @WebSocketServer()
    server: Server;

    private readonly logger = new Logger(CaroGateway.name);

    // Store active games and waiting players
    private waitingPlayers: Map<string, Socket> = new Map();
    private activeGames: Map<string, CaroGameSession> = new Map();
    private playerGameMap: Map<string, string> = new Map(); // playerId -> gameId

    // Handle new client connection
    handleConnection(client: Socket) {
        this.logger.log(`Client connected: ${client.id}`);
    }

    // Handle client disconnection
    handleDisconnect(client: Socket) {
        this.logger.log(`Client disconnected: ${client.id}`);

        // Remove from waiting players
        this.waitingPlayers.delete(client.id);

        // Handle game cleanup if player was in a game
        this.handlePlayerDisconnect(client.id);
    }

    // Join the matchmaking queue
    @SubscribeMessage('joinCaroQueue')
    handleJoinQueue(client: Socket) {
        this.logger.log(`Player ${client.id} joined Caro queue`);

        // Add to waiting players
        this.waitingPlayers.set(client.id, client);

        // Notify player
        client.emit('queueStatus', { status: 'waiting', message: 'Looking for opponent...' });

        // Try to match players
        this.tryMatchPlayers();
    }

    // Make a move in the game
    @SubscribeMessage('makeCaroMove')
    handleMakeMove(client: Socket, data: MakeMoveDto) {
        const gameId = this.playerGameMap.get(client.id);
        if (!gameId) {
            client.emit('moveResult', { success: false, message: 'Not in a game' });
            return;
        }

        const gameSession = this.activeGames.get(gameId);
        if (!gameSession) {
            client.emit('moveResult', { success: false, message: 'Game not found' });
            return;
        }

        // Verify it's the player's turn
        const playerNumber = gameSession.player1Id === client.id ? 1 : 2;
        if (gameSession.gameState.currentPlayer !== playerNumber) {
            client.emit('moveResult', { success: false, message: 'Not your turn' });
            return;
        }

        // Make the move
        const result = this.caroService.makeMove(
            gameSession.gameState,
            data.row,
            data.col,
            playerNumber
        );

        if (result.success) {
            // Broadcast the move to both players
            const moveData = {
                row: data.row,
                col: data.col,
                player: playerNumber,
                gameState: gameSession.gameState
            };

            // Send to both players
            gameSession.player1.emit('caroMoveMade', moveData);
            gameSession.player2.emit('caroMoveMade', moveData);

            // If game is over, clean up
            if (gameSession.gameState.gameOver) {
                this.logger.log(`Game ${gameId} ended. Winner: ${gameSession.gameState.winner}`);
                setTimeout(() => {
                    this.cleanupGame(gameId);
                }, 5000); // Clean up after 5 seconds
            }
        } else {
            client.emit('moveResult', result);
        }
    }

    // Leave the current game
    @SubscribeMessage('leaveCaroGame')
    handleLeaveGame(client: Socket) {
        this.handlePlayerDisconnect(client.id);
        client.emit('gameLeft', { message: 'You left the game' });
    }

    // Get current game state
    @SubscribeMessage('getCaroGameState')
    handleGetGameState(client: Socket) {
        const gameId = this.playerGameMap.get(client.id);
        if (!gameId) {
            client.emit('gameState', { error: 'Not in a game' });
            return;
        }

        const gameSession = this.activeGames.get(gameId);
        if (gameSession) {
            client.emit('gameState', { gameState: gameSession.gameState });
        }
    }

    constructor(private caroService: CaroService) { }

    // Try to match waiting players
    private tryMatchPlayers() {
        if (this.waitingPlayers.size >= 2) {
            const players = Array.from(this.waitingPlayers.entries()).slice(0, 2);
            const [player1Id, player1Socket] = players[0];
            const [player2Id, player2Socket] = players[1];

            // Remove from waiting list
            this.waitingPlayers.delete(player1Id);
            this.waitingPlayers.delete(player2Id);

            // Create new game session
            const gameId = `caro_${Date.now()}`;
            const gameSession: CaroGameSession = {
                id: gameId,
                player1: player1Socket,
                player2: player2Socket,
                player1Id: player1Id,
                player2Id: player2Id,
                gameState: this.caroService.createNewGame()
            };

            // Store game session
            this.activeGames.set(gameId, gameSession);
            this.playerGameMap.set(player1Id, gameId);
            this.playerGameMap.set(player2Id, gameId);

            // Notify both players
            const gameData = {
                gameId,
                opponent: 'Player',
                playerNumber: 1, // player1 is always X
                gameState: gameSession.gameState
            };

            player1Socket.emit('caroMatchFound', { ...gameData, playerNumber: 1 });
            player2Socket.emit('caroMatchFound', { ...gameData, playerNumber: 2 });

            this.logger.log(`Created Caro game: ${gameId} with players ${player1Id} and ${player2Id}`);
        }
    }

    // Handle player disconnection from game
    private handlePlayerDisconnect(playerId: string) {
        const gameId = this.playerGameMap.get(playerId);
        if (!gameId) return;

        const gameSession = this.activeGames.get(gameId);
        if (gameSession) {
            // Notify other player
            const otherPlayer = gameSession.player1Id === playerId ? gameSession.player2 : gameSession.player1;
            if (otherPlayer) {
                otherPlayer.emit('opponentDisconnected', { message: 'Opponent disconnected' });
            }

            // Clean up game
            this.cleanupGame(gameId);
        }
    }

    // Clean up game resources
    private cleanupGame(gameId: string) {
        const gameSession = this.activeGames.get(gameId);
        if (gameSession) {
            // Remove player mappings
            this.playerGameMap.delete(gameSession.player1Id);
            this.playerGameMap.delete(gameSession.player2Id);

            // Remove game session
            this.activeGames.delete(gameId);

            this.logger.log(`Cleaned up game: ${gameId}`);
        }
    }
}