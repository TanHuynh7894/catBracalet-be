import { PartialType } from '@nestjs/swagger';
import { CreateProductMaterialDto } from './create-product-material.dto';

export class UpdateProductMaterialDto extends PartialType(CreateProductMaterialDto) {}
