import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { VouchersService } from './vouchers.service';
import { CreateVouchersDto } from './dto/create-vouchers.dto';
import { UpdateVouchersDto } from './dto/update-vouchers.dto';
import { RemoveVouchersDto } from './dto/remove-vouchers.dto';

@ApiTags('Vouchers')
@Controller('vouchers')
export class VouchersController {
  constructor(private readonly vouchersService: VouchersService) {}

  @Post()
  create(@Body() createVouchersDto: CreateVouchersDto) {
    return this.vouchersService.create(createVouchersDto);
  }

  @Get()
  findAll() {
    return this.vouchersService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.vouchersService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateVouchersDto: UpdateVouchersDto) {
    return this.vouchersService.update(id, updateVouchersDto);
  }

  @Delete('remove')
  removeWithDto(@Body() removeVouchersDto: RemoveVouchersDto) {
    return this.vouchersService.remove(removeVouchersDto.vouchersId);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.vouchersService.remove(id);
  }
}
