import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TicketMessagesService } from './ticket-messages.service';
import { TicketMessageEntity } from './entities/ticket-message.entity';
import { TicketMessagesController } from './ticket-messages.controller'; // Import thêm dòng này

@Module({
  imports: [
    TypeOrmModule.forFeature([TicketMessageEntity]),
  ],
  controllers: [TicketMessagesController], // Đưa Controller vào đây
  providers: [TicketMessagesService],
  exports: [TicketMessagesService],
})
export class TicketMessagesModule {}