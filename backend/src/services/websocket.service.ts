import { Server as SocketIOServer, Socket } from 'socket.io';
import { logger, loggers } from '@/utils/logger';
import { config } from '@/config/environment';

/**
 * WebSocket Service for real-time game communication
 * Handles player connections, game events, and multiplayer functionality
 */

interface ConnectedPlayer {
  id: string;
  socketId: string;
  address?: string;
  username?: string;
  currentGame?: string;
  joinedAt: Date;
  lastActivity: Date;
}

export class WebSocketService {
  private io: SocketIOServer;
  private connectedPlayers: Map<string, ConnectedPlayer> = new Map();
  private gameRooms: Map<string, Set<string>> = new Map();

  constructor(io: SocketIOServer) {
    this.io = io;
  }

  /**
   * Initialize WebSocket service with event handlers
   */
  public async initialize(): Promise<void> {
    try {
      this.setupEventHandlers();
      this.setupRoomManagement();
      this.startHeartbeat();
      
      logger.info('🔌 WebSocket service initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize WebSocket service:', error);
      throw error;
    }
  }

  /**
   * Setup main socket event handlers
   */
  private setupEventHandlers(): void {
    this.io.on('connection', (socket: Socket) => {
      loggers.websocketEvent('connection', socket.id);
      
      // Handle player authentication
      socket.on('authenticate', async (data: { address?: string; username?: string; signature?: string }) => {
        try {
          const player = await this.authenticatePlayer(socket, data);
          if (player) {
            socket.emit('authenticated', { success: true, player });
            loggers.websocketEvent('authenticated', socket.id, player.address);
          } else {
            socket.emit('authentication_failed', { success: false, message: 'Invalid credentials' });
          }
        } catch (error) {
          logger.error('Authentication error:', error);
          socket.emit('authentication_failed', { success: false, message: 'Authentication error' });
        }
      });

      // Handle game events
      socket.on('join_game', (data: { gameId?: string; gameType?: string }) => {
        this.handleJoinGame(socket, data);
      });

      socket.on('leave_game', () => {
        this.handleLeaveGame(socket);
      });

      socket.on('player_action', (data: any) => {
        this.handlePlayerAction(socket, data);
      });

      socket.on('game_update', (data: any) => {
        this.handleGameUpdate(socket, data);
      });

      // Handle chat messages
      socket.on('chat_message', (data: { message: string; room?: string }) => {
        this.handleChatMessage(socket, data);
      });

      // Handle heartbeat/ping
      socket.on('ping', () => {
        socket.emit('pong', { timestamp: Date.now() });
        this.updatePlayerActivity(socket.id);
      });

      // Handle disconnection
      socket.on('disconnect', (reason: string) => {
        loggers.websocketEvent('disconnect', socket.id, undefined, { reason });
        this.handleDisconnection(socket);
      });

      // Handle errors
      socket.on('error', (error: Error) => {
        logger.error('Socket error:', error, { socketId: socket.id });
      });
    });
  }

  /**
   * Authenticate player connection
   */
  private async authenticatePlayer(socket: Socket, data: { address?: string; username?: string; signature?: string }): Promise<ConnectedPlayer | null> {
    try {
      // TODO: Implement proper signature verification
      // For now, basic validation
      if (!data.address || !data.address.match(/^S[TP][A-Z0-9]{39}$/)) {
        return null;
      }

      const player: ConnectedPlayer = {
        id: data.address,
        socketId: socket.id,
        address: data.address.toUpperCase(),
        username: data.username,
        joinedAt: new Date(),
        lastActivity: new Date(),
      };

      this.connectedPlayers.set(socket.id, player);
      socket.join(`player:${player.address}`); // Personal room for player-specific events

      return player;
    } catch (error) {
      logger.error('Player authentication failed:', error);
      return null;
    }
  }

  /**
   * Handle player joining a game
   */
  private handleJoinGame(socket: Socket, data: { gameId?: string; gameType?: string }): void {
    const player = this.connectedPlayers.get(socket.id);
    if (!player) {
      socket.emit('error', { message: 'Not authenticated' });
      return;
    }

    const gameRoom = data.gameId || `game:${data.gameType || 'general'}`;
    
    // Leave current game if any
    if (player.currentGame) {
      socket.leave(player.currentGame);
      this.removeFromGameRoom(player.currentGame, socket.id);
    }

    // Join new game
    socket.join(gameRoom);
    player.currentGame = gameRoom;
    this.addToGameRoom(gameRoom, socket.id);

    socket.emit('joined_game', { gameRoom, playerCount: this.getGameRoomSize(gameRoom) });
    socket.to(gameRoom).emit('player_joined', { 
      player: { address: player.address, username: player.username },
      playerCount: this.getGameRoomSize(gameRoom)
    });

    loggers.gameEvent('join_game', player.address || 'unknown', undefined, { gameRoom });
  }

  /**
   * Handle player leaving a game
   */
  private handleLeaveGame(socket: Socket): void {
    const player = this.connectedPlayers.get(socket.id);
    if (!player || !player.currentGame) {
      return;
    }

    socket.leave(player.currentGame);
    socket.to(player.currentGame).emit('player_left', { 
      player: { address: player.address, username: player.username },
      playerCount: this.getGameRoomSize(player.currentGame) - 1
    });

    this.removeFromGameRoom(player.currentGame, socket.id);
    player.currentGame = undefined;

    socket.emit('left_game', { success: true });
    loggers.gameEvent('leave_game', player.address || 'unknown');
  }

  /**
   * Handle player actions in game
   */
  private handlePlayerAction(socket: Socket, data: any): void {
    const player = this.connectedPlayers.get(socket.id);
    if (!player || !player.currentGame) {
      socket.emit('error', { message: 'Not in a game' });
      return;
    }

    // Broadcast action to other players in the same game
    socket.to(player.currentGame).emit('player_action', {
      player: { address: player.address, username: player.username },
      action: data,
      timestamp: Date.now(),
    });

    loggers.gameEvent('player_action', player.address || 'unknown', undefined, { action: data.type });
  }

  /**
   * Handle game state updates
   */
  private handleGameUpdate(socket: Socket, data: any): void {
    const player = this.connectedPlayers.get(socket.id);
    if (!player || !player.currentGame) {
      return;
    }

    // Broadcast update to all players in the game
    this.io.to(player.currentGame).emit('game_update', {
      type: data.type,
      data: data.payload,
      timestamp: Date.now(),
    });
  }

  /**
   * Handle chat messages
   */
  private handleChatMessage(socket: Socket, data: { message: string; room?: string }): void {
    const player = this.connectedPlayers.get(socket.id);
    if (!player) {
      return;
    }

    const room = data.room || player.currentGame || 'global';
    const message = {
      id: Date.now().toString(),
      player: { address: player.address, username: player.username },
      message: data.message.slice(0, 500), // Limit message length
      timestamp: Date.now(),
    };

    this.io.to(room).emit('chat_message', message);
  }

  /**
   * Handle player disconnection
   */
  private handleDisconnection(socket: Socket): void {
    const player = this.connectedPlayers.get(socket.id);
    if (!player) {
      return;
    }

    // Remove from game room
    if (player.currentGame) {
      socket.to(player.currentGame).emit('player_left', { 
        player: { address: player.address, username: player.username },
        playerCount: this.getGameRoomSize(player.currentGame) - 1
      });
      this.removeFromGameRoom(player.currentGame, socket.id);
    }

    // Remove from connected players
    this.connectedPlayers.delete(socket.id);

    loggers.gameEvent('disconnect', player.address || 'unknown');
  }

  /**
   * Update player activity timestamp
   */
  private updatePlayerActivity(socketId: string): void {
    const player = this.connectedPlayers.get(socketId);
    if (player) {
      player.lastActivity = new Date();
    }
  }

  /**
   * Setup room management
   */
  private setupRoomManagement(): void {
    // Clean up empty rooms periodically
    setInterval(() => {
      for (const [roomName, players] of this.gameRooms.entries()) {
        if (players.size === 0) {
          this.gameRooms.delete(roomName);
        }
      }
    }, 60000); // Clean up every minute
  }

  /**
   * Start heartbeat to monitor connections
   */
  private startHeartbeat(): void {
    setInterval(() => {
      const now = new Date();
      const timeoutThreshold = 5 * 60 * 1000; // 5 minutes

      for (const [socketId, player] of this.connectedPlayers.entries()) {
        if (now.getTime() - player.lastActivity.getTime() > timeoutThreshold) {
          logger.warn('Player connection timeout', { socketId, address: player.address });
          this.io.to(socketId).disconnectSockets();
        }
      }
    }, 60000); // Check every minute
  }

  /**
   * Game room management helpers
   */
  private addToGameRoom(room: string, socketId: string): void {
    if (!this.gameRooms.has(room)) {
      this.gameRooms.set(room, new Set());
    }
    this.gameRooms.get(room)!.add(socketId);
  }

  private removeFromGameRoom(room: string, socketId: string): void {
    const roomPlayers = this.gameRooms.get(room);
    if (roomPlayers) {
      roomPlayers.delete(socketId);
    }
  }

  private getGameRoomSize(room: string): number {
    return this.gameRooms.get(room)?.size || 0;
  }

  /**
   * Public methods for broadcasting events
   */
  public broadcastTombstoneMinted(tombstoneData: any): void {
    this.io.emit('tombstone_minted', {
      type: 'tombstone_minted',
      data: tombstoneData,
      timestamp: Date.now(),
    });
  }

  public broadcastPlayerResurrected(resurrectionData: any): void {
    this.io.emit('player_resurrected', {
      type: 'player_resurrected',
      data: resurrectionData,
      timestamp: Date.now(),
    });
  }

  public broadcastLeaderboardUpdate(leaderboardData: any): void {
    this.io.emit('leaderboard_update', {
      type: 'leaderboard_update',
      data: leaderboardData,
      timestamp: Date.now(),
    });
  }

  public sendPersonalNotification(address: string, notification: any): void {
    this.io.to(`player:${address.toUpperCase()}`).emit('notification', {
      type: 'personal_notification',
      data: notification,
      timestamp: Date.now(),
    });
  }

  /**
   * Get service statistics
   */
  public getStats(): any {
    return {
      connectedPlayers: this.connectedPlayers.size,
      gameRooms: this.gameRooms.size,
      totalRoomPlayers: Array.from(this.gameRooms.values()).reduce((sum, room) => sum + room.size, 0),
    };
  }
}
