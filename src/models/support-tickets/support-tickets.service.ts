import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SupportTicket } from './entities/support-ticket.entity';

@Injectable()
export class SupportTicketsService {
  constructor(
    @InjectRepository(SupportTicket)
    private readonly ticketRepository: Repository<SupportTicket>,
  ) {}

  // 1. Tạo phòng chat mới bằng userId
  async createTicket(userId: string): Promise<SupportTicket> {
    const newTicket = this.ticketRepository.create({
      user_id: userId,
      status: 'open',
    });
    return await this.ticketRepository.save(newTicket);
  }

  // 2. Lấy danh sách toàn bộ Ticket (Dành cho Admin)
  async findAllTickets(): Promise<SupportTicket[]> {
    return await this.ticketRepository.find({
      order: { created_at: 'DESC' },
    });
  }

  // 3. Lấy danh sách Ticket của 1 User cụ thể
  async findTicketsByUser(userId: string): Promise<SupportTicket[]> {
    return await this.ticketRepository.find({
      where: { user_id: userId },
      order: { created_at: 'DESC' },
    });
  }

  // 4. Đóng Ticket khi đã hỗ trợ xong
  async closeTicket(id: string): Promise<SupportTicket> {
    const ticket = await this.ticketRepository.findOne({ where: { id } });
    if (!ticket) {
      throw new NotFoundException(`Không tìm thấy Ticket với ID: ${id}`);
    }

    ticket.status = 'closed';
    return await this.ticketRepository.save(ticket);
  }
}
