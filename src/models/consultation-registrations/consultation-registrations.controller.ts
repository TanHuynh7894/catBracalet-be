import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  ParseUUIDPipe,
} from '@nestjs/common';
import {
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiParam,
} from '@nestjs/swagger';

import { ConsultationRegistrationsService } from './consultation-registrations.service';
import { CreateConsultationRegistrationDto } from './dto/create-consultation-registration.dto';
import { ConsultationRegistration } from './entities/consultation-registration.entity';

@ApiTags('Consultation Registrations (Đăng ký tư vấn)')
@Controller('consultation-registrations')
export class ConsultationRegistrationsController {
  constructor(
    private readonly registrationsService: ConsultationRegistrationsService,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Tạo form đăng ký tư vấn mới' })
  @ApiCreatedResponse({ type: ConsultationRegistration })
  create(@Body() createDto: CreateConsultationRegistrationDto) {
    return this.registrationsService.create(createDto);
  }

  @Get()
  @ApiOperation({ summary: 'Lấy danh sách tất cả các lượt đăng ký' })
  @ApiOkResponse({ type: ConsultationRegistration, isArray: true })
  findAll() {
    return this.registrationsService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Lấy chi tiết 1 lượt đăng ký theo ID' })
  @ApiParam({ name: 'id', description: 'UUID của lượt đăng ký' })
  @ApiOkResponse({ type: ConsultationRegistration })
  findOne(@Param('id', new ParseUUIDPipe({ version: '4' })) id: string) {
    return this.registrationsService.findOne(id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Xóa 1 lượt đăng ký' })
  @ApiParam({ name: 'id', description: 'UUID của lượt đăng ký' })
  remove(@Param('id', new ParseUUIDPipe({ version: '4' })) id: string) {
    return this.registrationsService.remove(id);
  }
}
