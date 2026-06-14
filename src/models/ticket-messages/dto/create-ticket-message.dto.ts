import { IsNotEmpty, IsString, IsUUID, MaxLength } from 'class-validator';

export class CreateTicketMessageDto {
  @IsUUID()
  @IsNotEmpty({ message: 'ticket_id không được để trống' })
  ticket_id: string;

  @IsUUID()
  @IsNotEmpty({ message: 'sender_id không được để trống' })
  sender_id: string;

  @IsString()
  @IsNotEmpty({ message: 'sender_role không được để trống' })
  @MaxLength(10, { message: 'sender_role không được vượt quá 10 ký tự' })
  sender_role: string;

  @IsString()
  @IsNotEmpty({ message: 'message không được để trống' })
  message: string;

  @IsString()
  @IsNotEmpty({ message: 'status không được để trống' })
  @MaxLength(20, { message: 'status không được vượt quá 20 ký tự' })
  status: string;
}