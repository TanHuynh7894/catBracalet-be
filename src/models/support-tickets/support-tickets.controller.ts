import { Controller, Get, Post, Param, Patch, UseGuards, Req } from '@nestjs/common';
import { SupportTicketsService } from './support-tickets.service';
// Đảm bảo đường dẫn import Guard khớp với cấu trúc thư mục auth của bạn
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard'; 

@UseGuards(JwtAuthGuard) // Bảo vệ toàn bộ các API bên dưới bằng JWT Token
@Controller('support-tickets')
export class SupportTicketsController {
  constructor(private readonly supportTicketsService: SupportTicketsService) {}

  // API: POST /support-tickets 
  // Tự động lấy user_id từ token để tạo phòng
  @Post()
  create(@Req() req) {
    const userId = req.user.id; 
    return this.supportTicketsService.createTicket(userId);
  }

  // API: GET /support-tickets 
  // Lấy tất cả (Thực tế nên thêm RoleGuard để chỉ Admin mới gọi được hàm này)
  @Get()
  findAll() {
    return this.supportTicketsService.findAllTickets();
  }

  // API: GET /support-tickets/my-tickets 
  // Lấy danh sách phòng chat của chính người đang đăng nhập
  @Get('my-tickets')
  findMyTickets(@Req() req) {
    const userId = req.user.id;
    return this.supportTicketsService.findTicketsByUser(userId);
  }

  // API: PATCH /support-tickets/:id/close 
  // Đóng phòng chat
  @Patch(':id/close')
  closeTicket(@Param('id') id: string) {
    return this.supportTicketsService.closeTicket(id);
  }
}