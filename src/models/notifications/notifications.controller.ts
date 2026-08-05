import { Controller, Get, Post, Body, Patch, Param } from '@nestjs/common';
import { CreateNotificationDto } from './dto/create-notification.dto'; 
import { NotificationsService } from './notifications.service';

@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Post()
  create(@Body() payload: CreateNotificationDto) { 
    return this.notificationsService.createNotification(payload);
  }

  @Get()
  findAll() {
    return this.notificationsService.getNotifications();
  }

  @Get('unread-count')
  getUnreadCount() {
    return this.notificationsService.getUnreadCount();
  }

  @Patch(':id/read')
  markAsRead(@Param('id') id: string) {
    return this.notificationsService.markAsRead(id);
  }
}