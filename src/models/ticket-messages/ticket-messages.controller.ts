import { Controller, Get, Param, Delete } from '@nestjs/common';
import { TicketMessagesService } from './ticket-messages.service';

@Controller('ticket-messages')
export class TicketMessagesController {
  constructor(private readonly ticketMessagesService: TicketMessagesService) {}

  @Get(':ticketId')
  getMessagesByTicket(@Param('ticketId') ticketId: string) {
    return this.ticketMessagesService.getMessagesByTicketId(ticketId);
  }

  @Delete(':id')
  deleteMessage(@Param('id') id: string) {
  }
}
