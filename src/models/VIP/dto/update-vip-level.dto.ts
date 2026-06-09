import { PartialType } from '@nestjs/swagger';
import { CreateVipLevelDto } from './create-vip-level.dto';

export class UpdateVipLevelDto extends PartialType(CreateVipLevelDto) {}
