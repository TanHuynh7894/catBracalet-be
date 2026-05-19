import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateCartItemDto } from './dto/create-cart-item.dto';
import { UpdateCartItemDto } from './dto/update-cart-item.dto';
import { CartItem } from './entities/cart_items.entity';

@Injectable()
export class CartItemsService {
  constructor(
    @InjectRepository(CartItem)
    private readonly cartItemRepository: Repository<CartItem>,
  ) {}

  create(createCartItemDto: CreateCartItemDto) {
    const newCartItem = this.cartItemRepository.create(createCartItemDto);
    return this.cartItemRepository.save(newCartItem);
  }

  findAll() {
    return this.cartItemRepository.find({
      relations: ['cart'], // Include cart relation if needed
    });
  }

  async findOne(id: string) {
    const cartItem = await this.cartItemRepository.findOne({
      where: { id },
      relations: ['cart'],
    });
    if (!cartItem) {
      throw new NotFoundException(`CartItem with id ${id} not found`);
    }
    return cartItem;
  }

  update(id: string, updateCartItemDto: UpdateCartItemDto) {
    return this.cartItemRepository.update(id, updateCartItemDto);
  }

  remove(id: string) {
    return this.cartItemRepository.delete(id);
  }
}
