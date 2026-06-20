import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({ cors: { origin: '*' } })
export class NotificationsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  
  @WebSocketServer()
  server: Server;

  handleConnection(client: Socket) {
    console.log(`Nhân viên đã kết nối Socket: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    console.log(`Nhân viên đã ngắt kết nối: ${client.id}`);
  }

  // SỬA TÊN HÀM VÀ THAM SỐ Ở ĐÂY
  sendNotificationToAll(notification: any) {
    // Bắn chung sự kiện 'new_notification'
    this.server.emit('new_notification', notification);
  }
}