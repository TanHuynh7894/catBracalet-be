import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateCartDto } from './dto/create-cart.dto';
import { UpdateCartDto } from './dto/update-cart.dto';
import { Cart } from './entities/cart.entity';

@Injectable()
export class CartService {
  constructor(
    @InjectRepository(Cart)
    private readonly cartRepository: Repository<Cart>,
  ) {}

  create(createCartDto: CreateCartDto) {
    const newCart = this.cartRepository.create(createCartDto);
    return this.cartRepository.save(newCart);
  }

  findAll() {
    return this.cartRepository.find();
  }

  async findOne(id: string) {
    const cart = await this.cartRepository.findOne({
      where: { id },
    });
    if (!cart) {
      throw new NotFoundException(`Cart with id ${id} not found`);
    }
    return cart;
  }

  update(id: string, updateCartDto: UpdateCartDto) {
    return this.cartRepository.update(id, updateCartDto);
  }

  remove(id: string) {
    return this.cartRepository.delete(id);
  }
}
