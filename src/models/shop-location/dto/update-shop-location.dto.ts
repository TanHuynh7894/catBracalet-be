import { PartialType } from '@nestjs/swagger';
import { CreateShopLocationDto } from './create-shop-location.dto';

export class UpdateShopLocationDto extends PartialType(CreateShopLocationDto) {}
