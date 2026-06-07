import { IsNotEmpty, IsUUID } from 'class-validator';

export class CreateProductMaterialDto {
  @IsNotEmpty({ message: 'product_id không được để trống!' })
  @IsUUID('all', { message: 'product_id phải là định dạng UUID hợp lệ!' })
  product_id: string;

  @IsNotEmpty({ message: 'material_id không được để trống!' })
  @IsUUID('all', { message: 'material_id phải là định dạng UUID hợp lệ!' })
  material_id: string;
}
