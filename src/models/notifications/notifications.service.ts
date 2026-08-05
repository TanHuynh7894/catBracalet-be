import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateNotificationDto } from './dto/create-notification.dto'; 
import { Notification } from './entities/notification.entity';
import { NotificationsGateway } from './notifications.gateway';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    @InjectRepository(Notification)
    private readonly notificationRepo: Repository<Notification>,
    private readonly gateway: NotificationsGateway,
  ) {}

  async createNotification(data: CreateNotificationDto) {
    try {
      const entity = this.notificationRepo.create({
        userId: data.userId || null,
        title: data.title,
        content: data.message, 
        type: data.type,
        isRead: false,
        relatedId: data.relatedId || null,
      });

      const savedNotif = await this.notificationRepo.save(entity);

      this.gateway.sendNotificationToAll(savedNotif);

      return savedNotif;
    } catch (err) {
      const error = err as Error;
      this.logger.error(
        `[CRITICAL] Ghi DB Notification thất bại: ${error.message}`,
      );

      const fallbackObj = {
        id: Date.now().toString(),
        userId: data.userId || null,
        title: data.title,
        content: data.message,
        type: data.type,
        isRead: false,
        createdAt: new Date(),
        relatedId: data.relatedId || null,
      };

      this.gateway.sendNotificationToAll(fallbackObj);
      return fallbackObj;
    }
  }

  async getNotifications() {
    return await this.notificationRepo.find({
      order: { createdAt: 'DESC' },
    });
  }

  async getUnreadCount() {
    return await this.notificationRepo.count({
      where: { isRead: false },
    });
  }

  async markAsRead(id: string) {
    const notif = await this.notificationRepo.findOne({ where: { id } });
    if (!notif)
      return { success: false, message: 'Không tìm thấy thông báo này' };

    notif.isRead = true;
    await this.notificationRepo.save(notif);
    return { success: true, data: notif };
  }
}