import { Controller, Get, Param, Delete } from '@nestjs/common';
import { TicketMessagesService } from './ticket-messages.service';

@Controller('ticket-messages')
export class TicketMessagesController {
  constructor(private readonly ticketMessagesService: TicketMessagesService) {}

  // API: GET /ticket-messages/:ticketId 
  // Dùng để Frontend gọi lấy lịch sử tin nhắn khi vừa mở khung chat
  @Get(':ticketId')
  getMessagesByTicket(@Param('ticketId') ticketId: string) {
    return this.ticketMessagesService.getMessagesByTicketId(ticketId);
  }

  // API: DELETE /ticket-messages/:id (Tùy chọn cho Admin)
  // Xóa một tin nhắn cụ thể
  @Delete(':id')
  deleteMessage(@Param('id') id: string) {
    // Để dùng hàm này, bạn cần viết thêm hàm delete trong Service nhé
    // return this.ticketMessagesService.deleteMessage(id);
  }
}