import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import axios from 'axios';
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
    const coordinates = await this.geocodeAddress(dto.shopAddress);

    await this.shopLocationRepository.update(
      { isActive: true },
      { isActive: false },
    );

    const location = this.shopLocationRepository.create({
      shopName: 'Shop Location',
      shopAddress: dto.shopAddress,
      phoneNumber: 'N/A',
      workingHours: 'N/A',
      shopLatitude: coordinates.shopLatitude,
      shopLongitude: coordinates.shopLongitude,
      isActive: true,
    });

    return this.shopLocationRepository.save(location);
  }

  async findCurrent(): Promise<ShopLocation> {
    const location = await this.shopLocationRepository.findOne({
      where: { isActive: true },
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
    const coordinates = dto.shopAddress
      ? await this.geocodeAddress(dto.shopAddress)
      : {};

    this.shopLocationRepository.merge(location, {
      ...dto,
      ...coordinates,
    });

    return this.shopLocationRepository.save(location);
  }

  async setActive(id: string): Promise<ShopLocation> {
    const location = await this.findOne(id);

    await this.shopLocationRepository.update(
      { isActive: true },
      { isActive: false },
    );

    location.isActive = true;
    return this.shopLocationRepository.save(location);
  }

  async deactivate(id: string): Promise<ShopLocation> {
    const location = await this.findOne(id);

    location.isActive = false;
    return this.shopLocationRepository.save(location);
  }

  private async geocodeAddress(shopAddress: string) {
    try {
      const encodedAddress = encodeURIComponent(shopAddress);
      const response = await axios.get(
        `https://nominatim.openstreetmap.org/search?q=${encodedAddress}&format=json&limit=1`,
        {
          headers: {
            'User-Agent': 'CatBraceletBE/1.0 (shop-location-geocoding)',
            Referer: 'http://localhost:3000',
          },
        },
      );

      if (!Array.isArray(response.data) || response.data.length === 0) {
        throw new BadRequestException(
          'Không tìm thấy tọa độ cho địa chỉ này',
        );
      }

      const result = response.data[0];
      const shopLatitude = Number(result.lat);
      const shopLongitude = Number(result.lon);

      if (!Number.isFinite(shopLatitude) || !Number.isFinite(shopLongitude)) {
        throw new BadRequestException(
          'Không tìm thấy tọa độ cho địa chỉ này',
        );
      }

      return {
        shopLatitude,
        shopLongitude,
      };
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }

      throw new InternalServerErrorException(
        'Không thể geocode địa chỉ, vui lòng thử lại sau',
      );
    }
  }
}
