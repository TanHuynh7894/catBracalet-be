import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

export class UpdateReviewDto {
  @ApiPropertyOptional({
    description: 'Rating score from 1 to 5',
    example: 4,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5)
  rating?: number;

  @ApiPropertyOptional({
    description: 'Updated review comment',
    example: 'Still good after 1 month of use.',
  })
  @IsOptional()
  @IsString()
  comment?: string;
}
