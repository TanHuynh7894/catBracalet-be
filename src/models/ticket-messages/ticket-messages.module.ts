import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TicketMessagesService } from './ticket-messages.service';
import { TicketMessageEntity } from './entities/ticket-message.entity';
import { TicketMessagesController } from './ticket-messages.controller';
import { NotificationsModule } from '../notifications/notifications.module'; 

@Module({
  imports: [
    TypeOrmModule.forFeature([TicketMessageEntity]),
    NotificationsModule,
  ],
  controllers: [TicketMessagesController],
  providers: [TicketMessagesService],
  exports: [TicketMessagesService],
})
export class TicketMessagesModule {}
