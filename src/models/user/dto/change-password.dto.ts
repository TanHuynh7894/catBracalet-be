import { ApiProperty } from '@nestjs/swagger';

export class ChangePasswordDto {
    @ApiProperty({
        example: 'OldPassword123',
        description: 'Current password',
    })
    oldPassword: string;

    @ApiProperty({
        example: 'NewPassword123',
        description: 'New password (minimum 6 characters)',
    })
    newPassword: string;
}
