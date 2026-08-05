import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SupportTicketsService } from './support-tickets.service';
import { SupportTicketsController } from './support-tickets.controller';
import { SupportTicket } from './entities/support-ticket.entity';
import { TicketsGateway } from './tickets/tickets.gateway';
import { TicketMessagesModule } from '../ticket-messages/ticket-messages.module';
import { AuthModule } from '../../auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([SupportTicket]),
    TicketMessagesModule,
    AuthModule,
  ],
  controllers: [SupportTicketsController],
  providers: [SupportTicketsService, TicketsGateway],
})
export class SupportTicketsModule {}
