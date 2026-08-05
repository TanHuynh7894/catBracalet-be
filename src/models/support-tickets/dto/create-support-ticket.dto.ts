import { IsNotEmpty, IsUUID } from 'class-validator';

export class CreateSupportTicketDto {
  @IsUUID()
  @IsNotEmpty({ message: 'user_id không được để trống' })
  user_id: string;
}
