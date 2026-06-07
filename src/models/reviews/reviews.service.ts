import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { OrderItem } from '../orders/entities/order-item.entity';
import { Order } from '../orders/entities/order.entity';
import { CreateReviewDto, ReviewStatus } from './dto/create-review.dto';
import { UpdateReviewDto } from './dto/update-review.dto';
import { Review } from './entities/review.entity';

@Injectable()
export class ReviewsService {
  constructor(
    @InjectRepository(Review)
    private readonly reviewRepository: Repository<Review>,
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,
    @InjectRepository(OrderItem)
    private readonly orderItemRepository: Repository<OrderItem>,
  ) {}

  async create(createReviewDto: CreateReviewDto): Promise<Review> {
    const { productId } = await this.verifyPurchaseBeforeReview(
      createReviewDto.userId,
      createReviewDto.orderItemId,
    );

    const existingReview = await this.reviewRepository.findOne({
      where: {
        userId: createReviewDto.userId,
        orderItemId: createReviewDto.orderItemId,
        status: ReviewStatus.ACTIVE,
      },
    });

    if (existingReview) {
      throw new BadRequestException(
        'User has already reviewed this order item',
      );
    }

    const newReview = this.reviewRepository.create({
      ...createReviewDto,
      productId,
      status: ReviewStatus.ACTIVE,
    });

    return await this.reviewRepository.save(newReview);
  }

  async getReviewsByProduct(productId: string): Promise<Review[]> {
    return await this.reviewRepository.find({
      where: { productId, status: ReviewStatus.ACTIVE },
      relations: ['user', 'product'],
      order: { createdAt: 'DESC' },
    });
  }

  async getReviewsByUser(userId: string): Promise<Review[]> {
    return await this.reviewRepository.find({
      where: { userId },
      relations: ['user', 'product'],
      order: { createdAt: 'DESC' },
    });
  }

  async getReviewsByOrder(orderId: string): Promise<Review[]> {
    const order = await this.orderRepository.findOne({
      where: { id: orderId },
      relations: ['items'],
    });

    if (!order) {
      throw new NotFoundException(`Order with id ${orderId} not found`);
    }

    const orderItemIds = order.items.map((item) => item.id);

    if (!orderItemIds.length) return [];

    return await this.reviewRepository.find({
      where: {
        userId: order.userId,
        orderItemId: In(orderItemIds),
      },
      relations: ['user', 'product', 'orderItem'],
      order: { createdAt: 'DESC' },
    });
  }

  async verifyPurchaseBeforeReview(
    userId: string,
    orderItemId: string,
  ): Promise<{ canReview: true; productId: string }> {
    const orderItem = await this.orderItemRepository.findOne({
      where: { id: orderItemId },
      relations: ['order', 'variant', 'variant.productVariantMappings'],
    });

    if (!orderItem) {
      throw new NotFoundException(
        `Order item with id ${orderItemId} not found`,
      );
    }

    if (
      orderItem.order.userId !== userId ||
      orderItem.order.status !== 'COMPLETED'
    ) {
      throw new BadRequestException(
        'User can only review items from their completed orders',
      );
    }

    const productId = orderItem.variant.productVariantMappings?.[0]?.productId;
    if (!productId) {
      throw new BadRequestException(
        'Cannot resolve product from this order item variant',
      );
    }

    return { canReview: true, productId };
  }

  async findAll(): Promise<Review[]> {
    return await this.reviewRepository.find({
      relations: ['user', 'product', 'orderItem'],
    });
  }

  async findOne(id: string): Promise<Review> {
    const review = await this.reviewRepository.findOne({
      where: { id },
      relations: ['user', 'product', 'orderItem'],
    });

    if (!review) {
      throw new NotFoundException(`Review with id ${id} not found`);
    }

    return review;
  }

  async update(id: string, updateReviewDto: UpdateReviewDto): Promise<Review> {
    const review = await this.findOne(id);

    if ('status' in updateReviewDto) {
      throw new BadRequestException('Status cannot be updated in this API');
    }

    this.reviewRepository.merge(review, updateReviewDto);

    return await this.reviewRepository.save(review);
  }

  async softDelete(id: string): Promise<Review> {
    const review = await this.findOne(id);

    review.status = ReviewStatus.INACTIVE;

    return await this.reviewRepository.save(review);
  }

  async remove(id: string): Promise<void> {
    const review = await this.findOne(id);

    await this.reviewRepository.remove(review);
  }
}
