import { IsDate, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class FilterVoucherByDateDto {
    @ApiProperty({ example: '2024-01-01', description: 'Ngày bắt đầu' })
    @Type(() => Date)
    @IsDate()
    @IsNotEmpty()
    startDate: Date;

    @ApiProperty({ example: '2024-12-31', description: 'Ngày kết thúc' })
    @Type(() => Date)
    @IsDate()
    @IsNotEmpty()
    endDate: Date;
}
