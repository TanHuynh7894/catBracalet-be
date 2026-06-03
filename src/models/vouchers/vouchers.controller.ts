import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiQuery,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { VouchersService } from './vouchers.service';
import { CreateVouchersDto } from './dto/create-vouchers.dto';
import { UpdateVouchersDto } from './dto/update-vouchers.dto';
import { FilterVoucherByValueDto } from './dto/filter-voucher-by-value.dto';
import { FilterVoucherByDateDto } from './dto/filter-voucher-by-date.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';

@ApiTags('Vouchers')
@ApiBearerAuth('JWT-auth')
@Controller('vouchers')
export class VouchersController {
  constructor(private readonly vouchersService: VouchersService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Tạo voucher mới (Admin)' })
  create(@Body() createVouchersDto: CreateVouchersDto) {
    return this.vouchersService.create(createVouchersDto);
  }

  @Get()
  @ApiOperation({ summary: 'Lấy tất cả danh sách voucher (User/Admin)' })
  findAll() {
    return this.vouchersService.findAll();
  }

  @Get('code/:code')
  @ApiOperation({ summary: 'Tìm voucher theo mã code (User/Admin)' })
  getVoucherByCode(@Param('code') code: string) {
    return this.vouchersService.getVoucherByCode(code);
  }

  @Get('filter/status/:status')
  @Roles('ADMIN', 'STAFF')
  @ApiOperation({ summary: 'Lọc voucher theo trạng thái (Admin/Staff)' })
  filterByStatus(@Param('status') status: string) {
    return this.vouchersService.filterByStatus(status);
  }

  @Get('filter/value')
  @ApiOperation({
    summary: 'Lọc voucher theo khoảng giá trị giảm (User/Admin)',
  })
  filterByValue(@Query() filterDto: FilterVoucherByValueDto) {
    return this.vouchersService.filterByValueRange(
      filterDto.min,
      filterDto.max,
    );
  }

  @Get('filter/date')
  @ApiOperation({ summary: 'Lọc voucher theo khoảng thời gian (User/Admin)' })
  filterByDate(@Query() filterDto: FilterVoucherByDateDto) {
    return this.vouchersService.filterByDateRange(
      filterDto.startDate,
      filterDto.endDate,
    );
  }

  @Get(':id')
  @ApiOperation({ summary: 'Lấy chi tiết voucher theo ID (User/Admin)' })
  findOne(@Param('id') id: string) {
    return this.vouchersService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Cập nhật thông tin voucher (Admin)' })
  update(
    @Param('id') id: string,
    @Body() updateVouchersDto: UpdateVouchersDto,
  ) {
    return this.vouchersService.update(id, updateVouchersDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Vô hiệu hóa voucher (Admin)' })
  remove(@Param('id') id: string) {
    return this.vouchersService.remove(id);
  }
}
