import { Injectable } from '@nestjs/common';

// Định nghĩa cấu trúc chuẩn cho payload lúc tạo thông báo
export interface CreateNotificationPayload {
  title: string;
  message: string;
  type: string;
  relatedId: string;
}

@Injectable()
export class NotificationsService {
  // Mảng giả lập Database tạm thời
  private notifications = []; 

  // Hàm 1: Tạo và lưu thông báo mới (Đã dùng ở phần Ticket & Order)
  async createNotification(data: CreateNotificationPayload) {
    const newNotif = {
      id: Date.now().toString(),
      title: data.title,
      message: data.message,
      type: data.type,
      relatedId: data.relatedId,
      isRead: false,
      createdAt: new Date(),
    };
    
    // Lưu vào mảng
    this.notifications.push(newNotif);
    
    return newNotif;
  }

  // Hàm 2: Lấy danh sách (Có sắp xếp thời gian mới nhất lên đầu)
  async getNotifications() {
    return this.notifications.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  // Hàm 3: Lấy số lượng chưa đọc (isRead === false)
  async getUnreadCount() {
    return this.notifications.filter(n => n.isRead === false).length;
  }

  // Hàm 4: Đánh dấu đã đọc (Chuyển isRead thành true)
  async markAsRead(id: string) {
    const notif = this.notifications.find(n => n.id === id);
    
    if (notif) {
      notif.isRead = true;
      return { 
        success: true, 
        message: 'Đã đánh dấu là đã đọc',
        data: notif 
      };
    }

    // Trả về false nếu không tìm thấy ID thông báo
    return { 
      success: false, 
      message: 'Không tìm thấy thông báo này' 
    };
  }
}