import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class FilterProductDto {
  @ApiPropertyOptional({ description: 'Màu sắc (ví dụ: màu dây)' })
  @IsOptional()
  @IsString()
  color?: string;

  // THÊM MỚI: Màu đá
  @ApiPropertyOptional({ description: 'Màu đá' })
  @IsOptional()
  @IsString()
  stoneColor?: string;

  @ApiPropertyOptional({ description: 'Loại đá' })
  @IsOptional()
  @IsString()
  stoneType?: string;

  @ApiPropertyOptional({ description: 'Kích cỡ' })
  @IsOptional()
  @IsString()
  size?: string;

  @ApiPropertyOptional({ description: 'Giá thấp nhất' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  minPrice?: number;

  @ApiPropertyOptional({ description: 'Giá cao nhất' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  maxPrice?: number;
}