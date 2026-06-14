import { IsNotEmpty, IsUUID } from 'class-validator';

export class CreateSupportTicketDto {
  // Chỉ cần truyền user_id lên là đủ để tạo 1 phòng chat mới
  @IsUUID()
  @IsNotEmpty({ message: 'user_id không được để trống' })
  user_id: string;
}