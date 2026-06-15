import { Controller, Get, Patch, Param } from '@nestjs/common';
import { NotificationsService } from './notifications.service';

@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  // API 1: Lấy toàn bộ danh sách thông báo
  // Method: GET http://localhost:3000/api/notifications
  @Get()
  async getAllNotifications() {
    return this.notificationsService.getNotifications();
  }

  // API 2: Lấy số lượng thông báo chưa đọc (để hiển thị số màu đỏ trên icon chuông)
  // Method: GET http://localhost:3000/api/notifications/unread-count
  @Get('unread-count')
  async getUnreadCount() {
    const count = await this.notificationsService.getUnreadCount();
    return { unreadCount: count };
  }

  // API 3: Đánh dấu 1 thông báo là đã đọc
  // Method: PATCH http://localhost:3000/api/notifications/:id/read
  @Patch(':id/read')
  async markAsRead(@Param('id') id: string) {
    return this.notificationsService.markAsRead(id);
  }
}