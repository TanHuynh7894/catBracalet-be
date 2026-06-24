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
import { ShipmentService } from '../shipment/shipment.service';

@Injectable()
export class ShopLocationService {
  constructor(
    @InjectRepository(ShopLocation)
    private readonly shopLocationRepository: Repository<ShopLocation>,
    private readonly shipmentService: ShipmentService,
  ) {}

  async create(dto: CreateShopLocationDto): Promise<ShopLocation> {
    const resolvedAddress = await this.resolveShopAddress(dto);
    const coordinates = await this.geocodeAddress(
      resolvedAddress.geocodeCandidates,
    );

    const location = this.shopLocationRepository.create({
      shopName: dto.shopName ?? 'Shop Location',
      shopAddress: resolvedAddress.fullAddress,
      province: resolvedAddress.province,
      district: resolvedAddress.district,
      ward: resolvedAddress.ward,
      detailAddress: dto.detailAddress,
      phoneNumber: dto.phoneNumber ?? 'N/A',
      workingHours: dto.workingHours ?? 'N/A',
      shopLatitude: coordinates.shopLatitude,
      shopLongitude: coordinates.shopLongitude,
      isActive: dto.isActive ?? true,
    });

    return this.shopLocationRepository.save(location);
  }

  getProvinces() {
    return this.shipmentService.getProvinces();
  }

  getDistricts(provinceId: string) {
    return this.shipmentService.getDistricts(provinceId);
  }

  getWards(districtId: string) {
    return this.shipmentService.getWards(districtId);
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

  async findActive(): Promise<ShopLocation[]> {
    return this.shopLocationRepository.find({
      where: { isActive: true },
      order: { updatedAt: 'DESC' },
    });
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
    const addressPatch = this.hasAddressChange(dto)
      ? await this.resolveShopAddress({
          province: dto.province ?? location.province,
          district: dto.district ?? location.district,
          ward: dto.ward ?? location.ward,
          detailAddress: dto.detailAddress ?? location.detailAddress,
        })
      : null;
    const coordinates = addressPatch
      ? await this.geocodeAddress(addressPatch.geocodeCandidates)
      : {};

    this.shopLocationRepository.merge(location, {
      ...dto,
      ...(addressPatch
        ? {
            shopAddress: addressPatch.fullAddress,
            province: addressPatch.province,
            district: addressPatch.district,
            ward: addressPatch.ward,
            detailAddress: dto.detailAddress ?? location.detailAddress,
          }
        : {}),
      ...coordinates,
    });

    return this.shopLocationRepository.save(location);
  }

  async setActive(id: string): Promise<ShopLocation> {
    const location = await this.findOne(id);

    location.isActive = true;
    return this.shopLocationRepository.save(location);
  }

  async deactivate(id: string): Promise<ShopLocation> {
    const location = await this.findOne(id);

    location.isActive = false;
    return this.shopLocationRepository.save(location);
  }

  private async resolveShopAddress(
    dto: Pick<
      CreateShopLocationDto,
      'province' | 'district' | 'ward' | 'detailAddress'
    >,
  ) {
    const address = await this.shipmentService.resolveAddressDetails(
      dto.province,
      dto.district,
      dto.ward,
    );
    const fullAddress = [
      dto.detailAddress,
      address.wardName,
      address.districtName,
      address.cityName,
      'Viet Nam',
    ]
      .filter(Boolean)
      .join(', ');
    const geocodeCandidates = [
      fullAddress,
      [address.wardName, address.districtName, address.cityName, 'Viet Nam']
        .filter(Boolean)
        .join(', '),
      [address.districtName, address.cityName, 'Viet Nam']
        .filter(Boolean)
        .join(', '),
      [address.cityName, 'Viet Nam'].filter(Boolean).join(', '),
    ];

    return {
      province: address.city,
      district: address.district,
      ward: address.ward,
      fullAddress,
      geocodeCandidates,
    };
  }

  private hasAddressChange(dto: UpdateShopLocationDto): boolean {
    return Boolean(
      dto.province || dto.district || dto.ward || dto.detailAddress,
    );
  }

  private async geocodeAddress(shopAddresses: string[]) {
    try {
      for (const shopAddress of [...new Set(shopAddresses.filter(Boolean))]) {
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
          continue;
        }

        const result = response.data[0];
        const shopLatitude = Number(result.lat);
        const shopLongitude = Number(result.lon);

        if (!Number.isFinite(shopLatitude) || !Number.isFinite(shopLongitude)) {
          continue;
        }

        return {
          shopLatitude,
          shopLongitude,
        };
      }

      throw new BadRequestException('Cannot find coordinates for this address');
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }

      throw new InternalServerErrorException(
        'Cannot geocode address, please try again later',
      );
    }
  }
}
