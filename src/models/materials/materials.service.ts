import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';

import { InjectRepository } from '@nestjs/typeorm';
import { ILike, Repository } from 'typeorm';

import {
  CreateMaterialDto,
  MaterialStatus,
} from './dto/create-material.dto';

import { UpdateMaterialDto } from './dto/update-material.dto';
import { Material } from './entities/material.entity';

@Injectable()
export class MaterialsService {
  constructor(
    @InjectRepository(Material)
    private readonly materialRepository: Repository<Material>,
  ) {}

  async create(createMaterialDto: CreateMaterialDto): Promise<Material> {
    const newMaterial = this.materialRepository.create({
      ...createMaterialDto,
      status: MaterialStatus.ACTIVE,
    });

    return await this.materialRepository.save(newMaterial);
  }

  async findAll(): Promise<Material[]> {
    return await this.materialRepository.find();
  }

  async findByName(name: string): Promise<Material[]> {
    const keyword = name.trim();

    if (!keyword) {
      return [];
    }

    return await this.materialRepository.find({
      where: {
        materialName: ILike(`%${keyword}%`),
      },
      order: {
        materialName: 'ASC',
      },
    });
  }

  async findOne(id: string): Promise<Material> {
    const material = await this.materialRepository.findOneBy({ id });

    if (!material) {
      throw new NotFoundException(
        `Material with id ${id} not found`,
      );
    }

    return material;
  }

  async update(
    id: string,
    updateMaterialDto: UpdateMaterialDto,
  ): Promise<Material> {
    const material = await this.findOne(id);

    // Không cho update status
    if ('status' in updateMaterialDto) {
      throw new BadRequestException(
        'Status cannot be updated in this API',
      );
    }

    this.materialRepository.merge(material, updateMaterialDto);

    return await this.materialRepository.save(material);
  }

  async softDelete(id: string): Promise<Material> {
    const material = await this.findOne(id);

    material.status = MaterialStatus.INACTIVE;

    return await this.materialRepository.save(material);
  }

  async remove(id: string): Promise<void> {
    const material = await this.findOne(id);

    await this.materialRepository.remove(material);
  }
}