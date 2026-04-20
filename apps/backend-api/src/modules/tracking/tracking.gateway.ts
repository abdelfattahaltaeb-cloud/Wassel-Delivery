import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer
} from '@nestjs/websockets';
import type { Server, Socket } from 'socket.io';

@WebSocketGateway({
  namespace: 'tracking',
  cors: {
    origin: '*'
  }
})
export class TrackingGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server!: Server;

  handleConnection(client: Socket) {
    client.emit('tracking.connected', {
      connectedAt: new Date().toISOString()
    });
  }

  handleDisconnect(client: Socket) {
    client.emit('tracking.disconnected', {
      disconnectedAt: new Date().toISOString()
    });
  }

  emitLocationUpdate(orderId: string | null, payload: unknown) {
    if (!orderId) {
      this.server.emit('tracking.location.updated', payload);

      return;
    }

    this.server.to(orderId).emit('tracking.location.updated', payload);
  }

  @SubscribeMessage('tracking.subscribe-order')
  subscribeToOrderRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { orderId: string }
  ) {
    client.join(payload.orderId);

    return {
      event: 'tracking.subscribe-order.ack',
      data: {
        orderId: payload.orderId,
        socketId: client.id,
        subscribedAt: new Date().toISOString()
      }
    };
  }

  @SubscribeMessage('tracking.heartbeat')
  handleHeartbeat(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { orderId?: string }
  ) {
    return {
      event: 'tracking.heartbeat.ack',
      data: {
        socketId: client.id,
        orderId: payload.orderId ?? null,
        acknowledgedAt: new Date().toISOString()
      }
    };
  }
}
