import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import {
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';

import { CreateMaterialDto } from './dto/create-material.dto';
import { UpdateMaterialDto } from './dto/update-material.dto';
import { Material } from './entities/material.entity';
import { MaterialsService } from './materials.service';

@ApiTags('Materials')
@Controller('materials')
export class MaterialsController {
  constructor(private readonly materialsService: MaterialsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a material' })
  @ApiCreatedResponse({ type: Material })
  create(@Body() createMaterialDto: CreateMaterialDto) {
    return this.materialsService.create(createMaterialDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all materials' })
  @ApiOkResponse({ type: Material, isArray: true })
  findAll() {
    return this.materialsService.findAll();
  }

  @Get('by-name/:name')
  @ApiOperation({ summary: 'Get materials by name' })
  @ApiParam({ name: 'name', description: 'Material name keyword' })
  @ApiOkResponse({ type: Material, isArray: true })
  findByName(@Param('name') name: string) {
    return this.materialsService.findByName(name);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get material by id' })
  @ApiParam({ name: 'id', description: 'Material UUID' })
  @ApiOkResponse({ type: Material })
  findOne(@Param('id') id: string) {
    return this.materialsService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Update material (status cannot be updated here)',
  })
  @ApiParam({ name: 'id', description: 'Material UUID' })
  @ApiOkResponse({ type: Material })
  update(
    @Param('id') id: string,
    @Body() updateMaterialDto: UpdateMaterialDto,
  ) {
    return this.materialsService.update(id, updateMaterialDto);
  }

  @Patch(':id/soft-delete')
  @ApiOperation({
    summary: 'Soft delete material (ACTIVE -> INACTIVE)',
  })
  @ApiParam({ name: 'id', description: 'Material UUID' })
  @ApiOkResponse({ type: Material })
  softDelete(@Param('id') id: string) {
    return this.materialsService.softDelete(id);
  }

  @Delete(':id/force')
  @ApiOperation({
    summary: 'Force delete material permanently',
  })
  @ApiParam({ name: 'id', description: 'Material UUID' })
  remove(@Param('id') id: string) {
    return this.materialsService.remove(id);
  }
}