import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateReviewDto, ReviewStatus } from './dto/create-review.dto';
import { UpdateReviewDto } from './dto/update-review.dto';
import { Review } from './entities/review.entity';

@Injectable()
export class ReviewsService {
  constructor(
    @InjectRepository(Review)
    private readonly reviewRepository: Repository<Review>,
  ) {}

  async create(createReviewDto: CreateReviewDto): Promise<Review> {
    const newReview = this.reviewRepository.create({
      ...createReviewDto,
      status: ReviewStatus.ACTIVE,
    });

    return await this.reviewRepository.save(newReview);
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

    if ((updateReviewDto as any).status) {
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
