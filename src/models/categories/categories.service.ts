import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ILike, Repository } from 'typeorm';

import { CategoryStatus, CreateCategoryDto } from './dto/create-category.dto';

import { UpdateCategoryDto } from './dto/update-category.dto';
import { Category } from './entities/category.entity';

@Injectable()
export class CategoriesService {
  constructor(
    @InjectRepository(Category)
    private readonly categoryRepository: Repository<Category>,
  ) {}

  async create(createCategoryDto: CreateCategoryDto): Promise<Category> {
    const newCategory = this.categoryRepository.create({
      ...createCategoryDto,
      status: CategoryStatus.ACTIVE,
    });

    return await this.categoryRepository.save(newCategory);
  }

  async findAll(): Promise<Category[]> {
    return await this.categoryRepository.find();
  }

  async findByName(name: string): Promise<Category[]> {
    const keyword = name.trim();

    if (!keyword) {
      return [];
    }

    return await this.categoryRepository.find({
      where: {
        categoryName: ILike(`%${keyword}%`),
      },
      order: {
        categoryName: 'ASC',
      },
    });
  }

  async findOne(id: string): Promise<Category> {
    const category = await this.categoryRepository.findOneBy({ id });

    if (!category) {
      throw new NotFoundException(`Category with id ${id} not found`);
    }

    return category;
  }

  async update(
    id: string,
    updateCategoryDto: Partial<UpdateCategoryDto>,
  ): Promise<Category> {
    const category = await this.findOne(id);

    this.categoryRepository.merge(category, updateCategoryDto);

    return await this.categoryRepository.save(category);
  }

  // // Soft delete
  // async softDelete(id: string): Promise<Category> {
  //   const category = await this.findOne(id);

  //   category.status = CategoryStatus.INACTIVE;

  //   return await this.categoryRepository.save(category);
  // }

  // Force delete
  async remove(id: string): Promise<void> {
    const category = await this.findOne(id);

    await this.categoryRepository.remove(category);
  }

  // Toggle status (Thay thế cho softDelete cũ)
  async softDelete(id: string): Promise<Category> {
    const category = await this.findOne(id);

    // Nếu đang ACTIVE thì chuyển thành INACTIVE, ngược lại thì thành ACTIVE
    category.status = category.status === CategoryStatus.ACTIVE 
      ? CategoryStatus.INACTIVE 
      : CategoryStatus.ACTIVE;

    return await this.categoryRepository.save(category);
  }
}
