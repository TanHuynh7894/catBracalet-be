import { Controller, Get, Post, Param, Patch, UseGuards, Req } from '@nestjs/common';
import { SupportTicketsService } from './support-tickets.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard'; 
import { ApiBearerAuth } from '@nestjs/swagger';
import { RolesGuard } from 'src/auth/guards/roles.guard';

@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard) 
@Controller('support-tickets')
export class SupportTicketsController {
  constructor(private readonly supportTicketsService: SupportTicketsService) {}

  // API: POST /support-tickets 
  // Tự động lấy user_id từ token để tạo phòng
  @Post()
  @ApiBearerAuth('JWT-auth')
  create(@Req() req) {
    const userId = req.user.id; 
    return this.supportTicketsService.createTicket(userId);
  }

  // API: GET /support-tickets 
  // Lấy tất cả (Thực tế nên thêm RoleGuard để chỉ Admin mới gọi được hàm này)
  @Get()
  @ApiBearerAuth('JWT-auth')
  findAll() {
    return this.supportTicketsService.findAllTickets();
  }

  // API: GET /support-tickets/my-tickets 
  // Lấy danh sách phòng chat của chính người đang đăng nhập
  @Get('my-tickets')
  @ApiBearerAuth('JWT-auth')
  findMyTickets(@Req() req) {
    const userId = req.user.id;
    return this.supportTicketsService.findTicketsByUser(userId);
  }

  // API: PATCH /support-tickets/:id/close 
  // Đóng phòng chat
  @Patch(':id/close')
  @ApiBearerAuth('JWT-auth')
  closeTicket(@Param('id') id: string) {
    return this.supportTicketsService.closeTicket(id);
  }
}