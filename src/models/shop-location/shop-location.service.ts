import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateShopLocationDto } from './dto/create-shop-location.dto';
import { UpdateShopLocationDto } from './dto/update-shop-location.dto';
import { ShopLocation } from './entities/shop-location.entity';

@Injectable()
export class ShopLocationService {
  constructor(
    @InjectRepository(ShopLocation)
    private readonly shopLocationRepository: Repository<ShopLocation>,
  ) {}

  async create(dto: CreateShopLocationDto): Promise<ShopLocation> {
    await this.shopLocationRepository.update(
      { status: 'ACTIVE' },
      { status: 'INACTIVE' },
    );

    const location = this.shopLocationRepository.create({
      ...dto,
      status: 'ACTIVE',
    });

    return this.shopLocationRepository.save(location);
  }

  async findCurrent(): Promise<ShopLocation> {
    const location = await this.shopLocationRepository.findOne({
      where: { status: 'ACTIVE' },
      order: { updatedAt: 'DESC' },
    });

    if (!location) {
      throw new NotFoundException('Active shop location not found');
    }

    return location;
  }

  async findAll(): Promise<ShopLocation[]> {
    return this.shopLocationRepository.find({
      order: { updatedAt: 'DESC' },
    });
  }

  async findOne(id: string): Promise<ShopLocation> {
    const location = await this.shopLocationRepository.findOneBy({ id });

    if (!location) {
      throw new NotFoundException(`Shop location with id ${id} not found`);
    }

    return location;
  }

  async update(id: string, dto: UpdateShopLocationDto): Promise<ShopLocation> {
    const location = await this.findOne(id);

    this.shopLocationRepository.merge(location, dto);

    return this.shopLocationRepository.save(location);
  }

  async setActive(id: string): Promise<ShopLocation> {
    const location = await this.findOne(id);

    await this.shopLocationRepository.update(
      { status: 'ACTIVE' },
      { status: 'INACTIVE' },
    );

    location.status = 'ACTIVE';
    return this.shopLocationRepository.save(location);
  }

  async deactivate(id: string): Promise<ShopLocation> {
    const location = await this.findOne(id);

    location.status = 'INACTIVE';
    return this.shopLocationRepository.save(location);
  }
}
