import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateWishlistDto } from './dto/create-wishlist.dto';
import { Wishlist } from './entities/wishlist.entity';

@Injectable()
export class WishlistsService {
  constructor(
    @InjectRepository(Wishlist)
    private readonly wishlistRepository: Repository<Wishlist>,
  ) {}

  async create(createWishlistDto: CreateWishlistDto): Promise<Wishlist> {
    const newWishlist = this.wishlistRepository.create(createWishlistDto);

    return await this.wishlistRepository.save(newWishlist);
  }

  async findAll(): Promise<Wishlist[]> {
    return await this.wishlistRepository.find({
      relations: ['user', 'product'],
    });
  }

  async findOne(id: string): Promise<Wishlist> {
    const wishlist = await this.wishlistRepository.findOne({
      where: { id },
      relations: ['user', 'product'],
    });

    if (!wishlist) {
      throw new NotFoundException(`Wishlist with id ${id} not found`);
    }

    return wishlist;
  }

  async remove(id: string): Promise<void> {
    const wishlist = await this.findOne(id);

    await this.wishlistRepository.remove(wishlist);
  }
}
