import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { TicketMessagesService } from '../../ticket-messages/ticket-messages.service';

@WebSocketGateway({ cors: { origin: '*' } })
export class TicketsGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  constructor(
    private readonly ticketMessagesService: TicketMessagesService,
    private readonly jwtService: JwtService,
  ) {}

  async handleConnection(client: Socket) {
    try {
      const authHeader = client.handshake.headers.authorization;
      if (!authHeader) throw new Error('Không có token');

      const token = authHeader.split(' ')[1];
      const decodedUser = await this.jwtService.verifyAsync(token);

      client.data.user = decodedUser;
      console.log(
        `[SOCKET] User kết nối: ${decodedUser.userId || decodedUser.id}`,
      );
    } catch (error) {
      console.log(`[SOCKET] Từ chối kết nối: ${(error as Error).message}`);
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    console.log(`[SOCKET] Client ngắt kết nối: ${client.id}`);
  }

  // Người dùng tham gia vào phòng chat
  @SubscribeMessage('joinTicket')
  async handleJoinTicket(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: any,
  ) {
    const data = typeof payload === 'string' ? JSON.parse(payload) : payload;
    client.join(data.ticket_id);
    console.log(`[SOCKET] Client ${client.id} đã vào phòng: ${data.ticket_id}`);

    // Gửi lại lịch sử chat cho người vừa join
    const history = await this.ticketMessagesService.getMessagesByTicketId(
      data.ticket_id,
    );
    client.emit('chatHistory', history);
  }

  // Người dùng gửi tin nhắn
  @SubscribeMessage('sendMessage')
  async handleSendMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: any,
  ) {
    const data = typeof payload === 'string' ? JSON.parse(payload) : payload;
    const user = client.data.user;

    if (!user) return;

    const senderId = user.userId || user.id || user.sub;

    // Lưu vào DB
    const savedMessage = await this.ticketMessagesService.saveMessage({
      ticket_id: data.ticket_id,
      sender_id: senderId,
      sender_role: user.role || 'user',
      message: data.message,
      status: 'sent',
    });

    // PHÁT TIN NHẮN CHO MỌI NGƯỜI TRONG PHÒNG (bao gồm cả người gửi)
    this.server.to(data.ticket_id).emit('newMessage', savedMessage);
    console.log(`[SOCKET] Đã phát tin nhắn tới room ${data.ticket_id}`);
  }
}
