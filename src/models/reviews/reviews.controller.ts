import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { CreateReviewDto } from './dto/create-review.dto';
import { UpdateReviewDto } from './dto/update-review.dto';
import { Review } from './entities/review.entity';
import { ReviewsService } from './reviews.service';

@ApiTags('Reviews')
@ApiBearerAuth('JWT-auth')
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

  @Get('product/:productId')
  @ApiOperation({ summary: 'Get active reviews by product id' })
  @ApiParam({ name: 'productId', description: 'Product UUID' })
  @ApiOkResponse({ type: Review, isArray: true })
  getReviewsByProduct(@Param('productId') productId: string) {
    return this.reviewsService.getReviewsByProduct(productId);
  }

  @Get('user/:userId')
  @ApiOperation({ summary: 'Get reviews by user id' })
  @ApiParam({ name: 'userId', description: 'User UUID' })
  @ApiOkResponse({ type: Review, isArray: true })
  getReviewsByUser(@Param('userId') userId: string) {
    return this.reviewsService.getReviewsByUser(userId);
  }

  @Get('order/:orderId')
  @ApiOperation({
    summary: 'Get reviews by order id from reviewed products in the order',
  })
  @ApiParam({ name: 'orderId', description: 'Order UUID' })
  @ApiOkResponse({ type: Review, isArray: true })
  getReviewsByOrder(@Param('orderId') orderId: string) {
    return this.reviewsService.getReviewsByOrder(orderId);
  }

  @Get('verify-purchase')
  @ApiOperation({ summary: 'Verify user can review a purchased order item' })
  @ApiQuery({ name: 'userId', description: 'User UUID' })
  @ApiQuery({ name: 'orderItemId', description: 'Order item UUID' })
  verifyPurchaseBeforeReview(
    @Query('userId') userId: string,
    @Query('orderItemId') orderItemId: string,
  ) {
    return this.reviewsService.verifyPurchaseBeforeReview(userId, orderItemId);
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
