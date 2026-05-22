import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';

import {
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';

import { CategoriesService } from './categories.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { Category } from './entities/category.entity';

@ApiTags('Categories')
@Controller('categories')
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Post()
  @ApiOperation({ summary: 'Create a category' })
  @ApiCreatedResponse({ type: Category })
  create(@Body() createCategoryDto: CreateCategoryDto) {
    return this.categoriesService.create(createCategoryDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all categories' })
  @ApiOkResponse({ type: Category, isArray: true })
  findAll() {
    return this.categoriesService.findAll();
  }

  @Get('by-name/:name')
  @ApiOperation({ summary: 'Get categories by name' })
  @ApiParam({ name: 'name', description: 'Category name keyword' })
  @ApiOkResponse({ type: Category, isArray: true })
  findByName(@Param('name') name: string) {
    return this.categoriesService.findByName(name);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get category by id' })
  @ApiParam({
    name: 'id',
    description: 'Category UUID',
  })
  @ApiOkResponse({ type: Category })
  findOne(@Param('id') id: string) {
    return this.categoriesService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Update category (cannot update status)',
  })
  @ApiParam({
    name: 'id',
    description: 'Category UUID',
  })
  @ApiOkResponse({ type: Category })
  update(
    @Param('id') id: string,
    @Body() updateCategoryDto: UpdateCategoryDto,
  ) {
    // Không cho update field status
    const { status, ...data } = updateCategoryDto as any;

    return this.categoriesService.update(id, data);
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'Soft delete category (ACTIVE -> INACTIVE)',
  })
  @ApiParam({
    name: 'id',
    description: 'Category UUID',
  })
  @ApiOkResponse({ type: Category })
  softDelete(@Param('id') id: string) {
    return this.categoriesService.softDelete(id);
  }

  @Delete(':id/force')
  @ApiOperation({
    summary: 'Force delete category permanently',
  })
  @ApiParam({
    name: 'id',
    description: 'Category UUID',
  })
  forceDelete(@Param('id') id: string) {
    return this.categoriesService.remove(id);
  }
}
