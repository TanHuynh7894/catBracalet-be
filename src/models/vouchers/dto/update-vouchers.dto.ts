import { PartialType } from '@nestjs/swagger';
import { CreateVouchersDto } from './create-vouchers.dto';

export class UpdateVouchersDto extends PartialType(CreateVouchersDto) {}
