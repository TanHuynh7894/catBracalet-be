import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SupportTicketsService } from './support-tickets.service';
import { SupportTicketsController } from './support-tickets.controller';
import { SupportTicket } from './entities/support-ticket.entity';
import { TicketsGateway } from './tickets/tickets.gateway';
import { TicketMessagesModule } from '../ticket-messages/ticket-messages.module';
// Nhớ kiểm tra lại đường dẫn tới file auth.module.ts của bạn xem đúng số lùi thư mục (../) chưa nhé
import { AuthModule } from '../../auth/auth.module'; 

@Module({
  imports: [
    TypeOrmModule.forFeature([SupportTicket]),
    TicketMessagesModule,
    AuthModule, // Tuyên bố cho NestJS biết: "Tao mượn đồ của AuthModule để xài nhé!"
  ],
  controllers: [SupportTicketsController],
  providers: [SupportTicketsService, TicketsGateway],
})
export class SupportTicketsModule {}