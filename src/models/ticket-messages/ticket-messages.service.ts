import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TicketMessageEntity } from './entities/ticket-message.entity';
import { CreateTicketMessageDto } from './dto/create-ticket-message.dto';

// Import Service và Gateway từ module Notifications
import { NotificationsService } from '../../notifications/notifications.service';
import { NotificationsGateway } from '../../notifications/notifications.gateway';

@Injectable()
export class TicketMessagesService {
  constructor(
    @InjectRepository(TicketMessageEntity)
    private readonly messageRepository: Repository<TicketMessageEntity>,
    
    // Inject các thành phần của hệ thống thông báo
    private readonly notificationsService: NotificationsService,
    private readonly notificationsGateway: NotificationsGateway,
  ) {}

  // Hàm lưu tin nhắn và tự động nổ thông báo
  async saveMessage(data: CreateTicketMessageDto): Promise<TicketMessageEntity> {
    console.log('[DEBUG SERVICE] Dữ liệu truyền xuống:', data);

    // 1. Tạo entity từ DTO và lưu vào Database
    const newMessage = this.messageRepository.create(data);
    const savedMessage = await this.messageRepository.save(newMessage);

    // ==========================================
    // 2. LOGIC NỔ THÔNG BÁO THỜI GIAN THỰC
    // ==========================================
    try {
      // Tạo bản ghi thông báo trong DB trước để không bị mất dữ liệu
      const newNotif = await this.notificationsService.createNotification({
        title: 'Tin nhắn hỗ trợ mới! 💬',
        message: `Có tin nhắn mới trong Ticket #${savedMessage.ticket_id}`, 
        type: 'MESSAGE',
        relatedId: savedMessage.ticket_id.toString(), 
      });

      // Bắn sự kiện qua Socket để UI nhận được ngay lập tức
      this.notificationsGateway.sendNotificationToAll(newNotif);
      
      console.log('[DEBUG SERVICE] Đã bắn thông báo thành công cho Ticket:', savedMessage.ticket_id);
    } catch (error) {
      // Đảm bảo luồng chính (lưu tin nhắn) không bị sập nếu hệ thống thông báo gặp trục trặc
      console.error('[ERROR] Lỗi khi tạo hoặc bắn thông báo:', error);
    }

    // 3. Trả về kết quả tin nhắn đã lưu
    return savedMessage;
  }

  // Hàm lấy lịch sử tin nhắn của một phòng chat
  async getMessagesByTicketId(ticketId: string): Promise<TicketMessageEntity[]> {
    return await this.messageRepository.find({
      where: { ticket_id: ticketId },
      order: { created_at: 'ASC' }, // Lấy từ cũ đến mới để hiển thị đúng luồng chat
    });
  }
}