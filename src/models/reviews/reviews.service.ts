import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
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
  ) {}

  async create(createReviewDto: CreateReviewDto): Promise<Review> {
    await this.verifyPurchaseBeforeReview(
      createReviewDto.userId,
      createReviewDto.productId,
    );

    const existingReview = await this.reviewRepository.findOne({
      where: {
        userId: createReviewDto.userId,
        productId: createReviewDto.productId,
        status: ReviewStatus.ACTIVE,
      },
    });

    if (existingReview) {
      throw new BadRequestException('User has already reviewed this product');
    }

    const newReview = this.reviewRepository.create({
      ...createReviewDto,
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
      relations: [
        'items',
        'items.variant',
        'items.variant.productVariantMappings',
      ],
    });

    if (!order) {
      throw new NotFoundException(`Order with id ${orderId} not found`);
    }

    const productIds = [
      ...new Set(
        order.items.flatMap((item) =>
          (item.variant.productVariantMappings ?? []).map(
            (mapping) => mapping.productId,
          ),
        ),
      ),
    ];

    if (!productIds.length) return [];

    return await this.reviewRepository.find({
      where: {
        userId: order.userId,
        productId: In(productIds),
      },
      relations: ['user', 'product'],
      order: { createdAt: 'DESC' },
    });
  }

  async verifyPurchaseBeforeReview(
    userId: string,
    productId: string,
  ): Promise<{ canReview: true }> {
    const purchasedOrder = await this.orderRepository
      .createQueryBuilder('order')
      .innerJoin('order.items', 'item')
      .innerJoin('item.variant', 'variant')
      .innerJoin('variant.productVariantMappings', 'mapping')
      .where('order.userId = :userId', { userId })
      .andWhere('order.status = :status', { status: 'COMPLETED' })
      .andWhere('mapping.productId = :productId', { productId })
      .getOne();

    if (!purchasedOrder) {
      throw new BadRequestException(
        'User can only review products from completed orders',
      );
    }

    return { canReview: true };
  }

  async findAll(): Promise<Review[]> {
    return await this.reviewRepository.find({
      relations: ['user', 'product'],
    });
  }

  async findOne(id: string): Promise<Review> {
    const review = await this.reviewRepository.findOne({
      where: { id },
      relations: ['user', 'product'],
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
