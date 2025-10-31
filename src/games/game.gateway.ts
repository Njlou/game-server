import { WebSocketGateway, WebSocketServer, OnGatewayConnection, OnGatewayDisconnect } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Injectable } from '@nestjs/common';

@Injectable()
@WebSocketGateway({ cors: true })
export class GameGateway implements OnGatewayConnection, OnGatewayDisconnect {
    @WebSocketServer()
    server: Server;

    private waitingPlayers: Map<string, { socket: Socket; gameType: string }> = new Map();
    private activeGames: Map<string, { players: Socket[]; gameType: string }> = new Map();

    handleConnection(client: Socket) {
        console.log(`Client connected: ${client.id}`);
    }

    handleDisconnect(client: Socket) {
        console.log(`Client disconnected: ${client.id}`);

        // Remove from waiting players
        this.waitingPlayers.delete(client.id);

        // Notify other players in active games
        this.activeGames.forEach((game, gameId) => {
            if (game.players.includes(client)) {
                game.players.forEach(player => {
                    if (player !== client) {
                        player.emit('playerDisconnected');
                    }
                });
                this.activeGames.delete(gameId);
            }
        });
    }

    joinQueue(client: Socket, gameType: string, userId: string) {
        this.waitingPlayers.set(client.id, { socket: client, gameType });

        // Find matching player
        for (const [otherClientId, otherPlayer] of this.waitingPlayers.entries()) {
            if (otherClientId !== client.id && otherPlayer.gameType === gameType) {
                // Create game session
                const gameId = `game_${Date.now()}`;
                this.activeGames.set(gameId, {
                    players: [client, otherPlayer.socket],
                    gameType
                });

                // Remove both from queue
                this.waitingPlayers.delete(client.id);
                this.waitingPlayers.delete(otherClientId);

                // Notify both players
                client.emit('matchFound', { gameId, opponent: 'Player' });
                otherPlayer.socket.emit('matchFound', { gameId, opponent: 'Player' });

                break;
            }
        }
    }

    broadcastToGame(gameId: string, event: string, data: any, excludeSocket?: Socket) {
        const game = this.activeGames.get(gameId);
        if (game) {
            game.players.forEach(player => {
                if (player !== excludeSocket) {
                    player.emit(event, data);
                }
            });
        }
    }
}