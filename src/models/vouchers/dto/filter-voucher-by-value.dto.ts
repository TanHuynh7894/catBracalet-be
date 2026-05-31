import { IsNumber, IsNotEmpty, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class FilterVoucherByValueDto {
    @ApiProperty({ example: 0, description: 'Giá trị giảm tối thiểu' })
    @Type(() => Number)
    @IsNumber()
    @Min(0)
    min: number;

    @ApiProperty({ example: 1000000, description: 'Giá trị giảm tối đa' })
    @Type(() => Number)
    @IsNumber()
    @Min(0)
    max: number;
}
