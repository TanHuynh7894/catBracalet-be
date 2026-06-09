import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Min,
} from 'class-validator';

export class AdminCreateShipmentDto {
  @ApiProperty({
    example: '9076656c-849a-4939-b9ba-8a81d8fbc151',
    description: 'Internal order id',
  })
  @IsUUID()
  orderId: string;

  @ApiProperty({
    example: 'OF8xXzc0OQ==',
    description: 'Rate id selected from Goship /rates response',
  })
  @IsString()
  @IsNotEmpty()
  rateId: string;

  @ApiProperty({
    example: 1,
    description: 'Shipping fee payer: 0 = customer, 1 = shop',
    required: false,
  })
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @IsOptional()
  payer?: number;

  @ApiProperty({
    example: 500,
    description: 'Parcel weight in grams',
    required: false,
  })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  weight?: number;

  @ApiProperty({
    example: 10,
    description: 'Parcel width in cm',
    required: false,
  })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  width?: number;

  @ApiProperty({
    example: 10,
    description: 'Parcel height in cm',
    required: false,
  })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  height?: number;

  @ApiProperty({
    example: 10,
    description: 'Parcel length in cm',
    required: false,
  })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  length?: number;

  @ApiProperty({
    example: 0,
    description: 'COD amount in VND',
    required: false,
  })
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @IsOptional()
  cod?: number;

  @ApiProperty({
    example: 'Hang trang suc, vui long giao nhe tay.',
    description: 'Shipment note/metadata',
    required: false,
  })
  @IsString()
  @IsOptional()
  note?: string;
}
