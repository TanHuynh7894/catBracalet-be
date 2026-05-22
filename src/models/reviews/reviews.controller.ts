import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import {
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { CreateReviewDto } from './dto/create-review.dto';
import { UpdateReviewDto } from './dto/update-review.dto';
import { Review } from './entities/review.entity';
import { ReviewsService } from './reviews.service';

@ApiTags('Reviews')
@Controller('reviews')
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a review' })
  @ApiCreatedResponse({ type: Review })
  create(@Body() createReviewDto: CreateReviewDto) {
    return this.reviewsService.create(createReviewDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all reviews' })
  @ApiOkResponse({ type: Review, isArray: true })
  findAll() {
    return this.reviewsService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get review by id' })
  @ApiParam({ name: 'id', description: 'Review UUID' })
  @ApiOkResponse({ type: Review })
  findOne(@Param('id') id: string) {
    return this.reviewsService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update review (status cannot be updated here)' })
  @ApiParam({ name: 'id', description: 'Review UUID' })
  @ApiOkResponse({ type: Review })
  update(@Param('id') id: string, @Body() updateReviewDto: UpdateReviewDto) {
    return this.reviewsService.update(id, updateReviewDto);
  }

  @Patch(':id/soft-delete')
  @ApiOperation({ summary: 'Soft delete review (ACTIVE -> INACTIVE)' })
  @ApiParam({ name: 'id', description: 'Review UUID' })
  @ApiOkResponse({ type: Review })
  softDelete(@Param('id') id: string) {
    return this.reviewsService.softDelete(id);
  }

  @Delete(':id/force')
  @ApiOperation({ summary: 'Force delete review permanently' })
  @ApiParam({ name: 'id', description: 'Review UUID' })
  remove(@Param('id') id: string) {
    return this.reviewsService.remove(id);
  }
}
