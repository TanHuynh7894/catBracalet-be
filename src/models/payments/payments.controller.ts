import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { PaymentsService } from './payments.service';
import { CreatePaymentsDto } from './dto/create-payments.dto';
import { UpdatePaymentsDto } from './dto/update-payments.dto';
import { RemovePaymentsDto } from './dto/remove-payments.dto';

@ApiTags('Payments')
@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post()
  create(@Body() createPaymentsDto: CreatePaymentsDto) {
    return this.paymentsService.create(createPaymentsDto);
  }

  @Get()
  findAll() {
    return this.paymentsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.paymentsService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updatePaymentsDto: UpdatePaymentsDto,
  ) {
    return this.paymentsService.update(id, updatePaymentsDto);
  }

  @Delete('remove')
  removeWithDto(@Body() removePaymentsDto: RemovePaymentsDto) {
    return this.paymentsService.remove(removePaymentsDto.paymentId);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.paymentsService.remove(id);
  }
}
