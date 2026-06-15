import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';

const toStringValue = ({ value }: { value: unknown }) => {
  if (
    value === undefined ||
    value === null ||
    typeof value === 'object' ||
    typeof value === 'symbol' ||
    typeof value === 'function'
  ) {
    return value;
  }

  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'boolean') {
    return value.toString();
  }
  if (typeof value === 'bigint') return value.toString();

  return value;
};

export class GoshipWebhookPathDto {
  @ApiPropertyOptional({ example: 'GS123123' })
  @Transform(toStringValue)
  @IsString()
  @IsOptional()
  uuid?: string;

  @ApiPropertyOptional({ example: 'GHN12345678' })
  @Transform(toStringValue)
  @IsString()
  @IsOptional()
  tracking_number?: string;

  @ApiPropertyOptional({
    example: 'https://donhang.ghn.vn/?order_code=GHN12345678',
  })
  @Transform(toStringValue)
  @IsString()
  @IsOptional()
  tracking_url?: string;

  @ApiPropertyOptional({ example: 'Dang giao' })
  @Transform(toStringValue)
  @IsString()
  @IsOptional()
  status?: string;
}

export class GoshipWebhookDto {
  @ApiPropertyOptional({ example: true })
  @IsBoolean()
  @IsOptional()
  is_ondemand_shipment?: boolean;

  @ApiPropertyOptional({
    example: 'GS6ZE234V6',
    description: 'Goship order code',
  })
  @Transform(toStringValue)
  @IsString()
  @IsOptional()
  gcode?: string;

  @ApiPropertyOptional({
    example: 'GAPBLXAE',
    description: 'Carrier tracking/order code',
  })
  @Transform(toStringValue)
  @IsString()
  @IsOptional()
  code?: string;

  @ApiProperty({
    example: '394e2494-56e1-48bc-a15b-2e008330ba26',
    description: 'Partner order id sent to Goship as order_id',
  })
  @Transform(toStringValue)
  @IsString()
  @IsNotEmpty()
  order_id!: string;

  @ApiPropertyOptional({ example: '2360.0000000000005' })
  @Transform(toStringValue)
  @IsString()
  @IsOptional()
  weight?: string;

  @ApiPropertyOptional({ example: '35650' })
  @Transform(toStringValue)
  @IsString()
  @IsOptional()
  fee?: string;

  @ApiPropertyOptional({ example: '0' })
  @Transform(toStringValue)
  @IsString()
  @IsOptional()
  cod?: string;

  @ApiPropertyOptional({
    example: '0',
    description: '0 = customer pays, 1 = shop pays',
  })
  @Transform(toStringValue)
  @IsString()
  @IsOptional()
  payer?: string;

  @ApiPropertyOptional({ example: '901' })
  @Transform(toStringValue)
  @IsString()
  @IsOptional()
  status?: string;

  @ApiPropertyOptional({ example: 'Cho shipper qua lay hang' })
  @Transform(toStringValue)
  @IsString()
  @IsOptional()
  message?: string;

  @ApiPropertyOptional({ example: 'Shipper dang tren duong den lay hang' })
  @Transform(toStringValue)
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ example: 'Cho lay hang' })
  @Transform(toStringValue)
  @IsString()
  @IsOptional()
  status_text?: string;

  @ApiPropertyOptional({
    example: 'https://donhang.ghn.vn/?order_code=GAPBLXAE',
  })
  @Transform(toStringValue)
  @IsString()
  @IsOptional()
  tracking_url?: string;

  @ApiPropertyOptional({ example: 'GAPBLXAE' })
  @Transform(toStringValue)
  @IsString()
  @IsOptional()
  sorting_code?: string;

  @ApiPropertyOptional({ example: 'HN-01-01-TM01' })
  @Transform(toStringValue)
  @IsString()
  @IsOptional()
  return_sorting_code?: string;

  @ApiPropertyOptional({ example: 0 })
  @Type(() => Number)
  @IsInt()
  @IsOptional()
  is_return?: number;

  @ApiPropertyOptional({ example: 0 })
  @Type(() => Number)
  @IsInt()
  @IsOptional()
  is_part_delivery?: number;

  @ApiPropertyOptional({ example: 0 })
  @Type(() => Number)
  @IsInt()
  @IsOptional()
  is_lost?: number;

  @ApiPropertyOptional({ example: 'ghn' })
  @Transform(toStringValue)
  @IsString()
  @IsOptional()
  carrier_short_name?: string;

  @ApiPropertyOptional({ example: -35650 })
  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  amount_return_shop?: number;

  @ApiPropertyOptional({ example: 1735700400 })
  @Type(() => Number)
  @IsInt()
  @IsOptional()
  update_time?: number;

  @ApiPropertyOptional({ type: [GoshipWebhookPathDto] })
  @IsArray()
  @IsOptional()
  paths?: GoshipWebhookPathDto[];
}
