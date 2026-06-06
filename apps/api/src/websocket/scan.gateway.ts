import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server } from 'ws';
import { Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';

@WebSocketGateway({
  path: '/ws',
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  },
})
export class ScanGateway implements OnGatewayConnection, OnGatewayDisconnect {
  private readonly logger = new Logger(ScanGateway.name);
  
  @WebSocketServer()
  server!: Server;

  // Active socket connections mapped by scanRoom: scanId -> Set of WebSockets
  private activeScanRooms = new Map<string, Set<any>>();

  handleConnection(client: any) {
    this.logger.log('Websocket client connection initiated.');
  }

  handleDisconnect(client: any) {
    this.logger.log('Websocket client disconnected. Pruning channel registrations...');
    
    // Remove the socket from all registered rooms to prevent memory leaks
    for (const [scanId, clients] of this.activeScanRooms.entries()) {
      if (clients.has(client)) {
        clients.delete(client);
        this.logger.log(`Client removed from scan room: ${scanId}`);
      }
      if (clients.size === 0) {
        this.activeScanRooms.delete(scanId);
      }
    }
  }

  /**
   * Client registers to receive progress updates for a specific scan ID
   */
  @SubscribeMessage('subscribeScan')
  handleSubscribeScan(
    @MessageBody() data: { scanId: string },
    @ConnectedSocket() client: any
  ) {
    const { scanId } = data;
    if (!scanId) {
      client.send(JSON.stringify({ event: 'error', data: 'Invalid Scan ID specified' }));
      return;
    }

    if (!this.activeScanRooms.has(scanId)) {
      this.activeScanRooms.set(scanId, new Set());
    }

    this.activeScanRooms.get(scanId)!.add(client);
    this.logger.log(`Client subscribed to progress updates for Scan: ${scanId}`);
    
    client.send(
      JSON.stringify({
        event: 'subscribed',
        data: { scanId, message: 'Subscribed to real-time strategic synthesis progress.' },
      })
    );
  }

  /**
   * Broadcasts progress/result messages to all active clients listening to a specific Scan ID room.
   */
  broadcastToScanRoom(scanId: string, event: string, payload: any) {
    const clients = this.activeScanRooms.get(scanId);
    if (!clients || clients.size === 0) {
      this.logger.log(`No active websocket clients listening to scan room: ${scanId}`);
      return;
    }

    const messageString = JSON.stringify({ event, payload });
    
    this.logger.log(`Broadcasting event: [${event}] to scan room: ${scanId} (${clients.size} clients)`);
    
    for (const client of clients) {
      try {
        if (client.readyState === 1) { // 1 represents OPEN state
          client.send(messageString);
        } else {
          clients.delete(client);
        }
      } catch (err) {
        this.logger.error(`Failed to push message to socket client in room ${scanId}`, err);
        clients.delete(client);
      }
    }
  }

  @OnEvent('scan.started')
  handleScanStartedEvent(payload: { scanId: string, status: string, message: string }) {
    this.broadcastToScanRoom(payload.scanId, 'scan:started', payload);
  }

  @OnEvent('agent.started')
  handleAgentStartedEvent(payload: { scanId: string, agentType: string }) {
    this.broadcastToScanRoom(payload.scanId, 'scan:agent_started', payload);
  }

  @OnEvent('scan.log')
  handleScanLogEvent(payload: { scanId: string, message: string }) {
    this.broadcastToScanRoom(payload.scanId, 'scan:log', payload);
  }

  @OnEvent('agent.completed')
  handleAgentCompletedEvent(payload: { scanId: string, agentType: string, agentScore: number, message: string }) {
    this.broadcastToScanRoom(payload.scanId, 'scan:agent_completed', payload);
  }

  @OnEvent('agent.failed')
  handleAgentFailedEvent(payload: { scanId: string, agentType: string, message: string }) {
    this.broadcastToScanRoom(payload.scanId, 'scan:agent_failed', payload);
  }

  @OnEvent('scan.completed')
  handleScanCompletedEvent(payload: { scanId: string, result: any }) {
    this.broadcastToScanRoom(payload.scanId, 'scan:completed', payload);
  }

  @OnEvent('scan.failed')
  handleScanFailedEvent(payload: { scanId: string, message: string }) {
    this.broadcastToScanRoom(payload.scanId, 'scan:failed', payload);
  }
}
