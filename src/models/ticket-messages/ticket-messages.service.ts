import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TicketMessageEntity } from './entities/ticket-message.entity';
import { CreateTicketMessageDto } from './dto/create-ticket-message.dto';

// Import Service và Gateway từ module Notifications
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationsGateway } from '../notifications/notifications.gateway';

@Injectable()
export class TicketMessagesService {
  constructor(
    @InjectRepository(TicketMessageEntity)
    private readonly messageRepository: Repository<TicketMessageEntity>,
    private readonly notificationsService: NotificationsService,
    private readonly notificationsGateway: NotificationsGateway,
  ) {}

  async saveMessage(
    data: CreateTicketMessageDto,
  ): Promise<TicketMessageEntity> {
    console.log('[DEBUG SERVICE] Dữ liệu truyền xuống:', data);

    const newMessage = this.messageRepository.create(data);
    const savedMessage = await this.messageRepository.save(newMessage);

    try {
      const newNotif = await this.notificationsService.createNotification({
        title: 'Tin nhắn hỗ trợ mới!',
        message: `Có tin nhắn mới trong Ticket #${savedMessage.ticket_id}`,
        type: 'MESSAGE',
        relatedId: savedMessage.ticket_id.toString(),
      });

      this.notificationsGateway.sendNotificationToAll(newNotif);

      console.log(
        '[DEBUG SERVICE] Đã bắn thông báo thành công cho Ticket:',
        savedMessage.ticket_id,
      );
    } catch (error) {
      console.error('[ERROR] Lỗi khi tạo hoặc bắn thông báo:', error);
    }

    return savedMessage;
  }

  async getMessagesByTicketId(
    ticketId: string,
  ): Promise<TicketMessageEntity[]> {
    return await this.messageRepository.find({
      where: { ticket_id: ticketId },
      order: { created_at: 'ASC' },
    });
  }
}
