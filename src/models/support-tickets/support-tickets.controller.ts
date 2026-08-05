import {
  Controller,
  Get,
  Post,
  Param,
  Patch,
  UseGuards,
  Req,
} from '@nestjs/common';
import { SupportTicketsService } from './support-tickets.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { ApiBearerAuth } from '@nestjs/swagger';
import { RolesGuard } from 'src/auth/guards/roles.guard';

@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('support-tickets')
export class SupportTicketsController {
  constructor(private readonly supportTicketsService: SupportTicketsService) {}

  @Post()
  @ApiBearerAuth('JWT-auth')
  create(@Req() req) {
    const userId = req.user.id;
    return this.supportTicketsService.createTicket(userId);
  }

  @Get()
  @ApiBearerAuth('JWT-auth')
  findAll() {
    return this.supportTicketsService.findAllTickets();
  }

  @Get('my-tickets')
  @ApiBearerAuth('JWT-auth')
  findMyTickets(@Req() req) {
    const userId = req.user.id;
    return this.supportTicketsService.findTicketsByUser(userId);
  }

  @Patch(':id/close')
  @ApiBearerAuth('JWT-auth')
  closeTicket(@Param('id') id: string) {
    return this.supportTicketsService.closeTicket(id);
  }
}
