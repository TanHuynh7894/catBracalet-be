import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreatePaymentsDto } from './dto/create-payments.dto';
import { UpdatePaymentsDto } from './dto/update-payments.dto';
import { Payments } from './entities/payments.entity';

@Injectable()
export class PaymentsService {
  constructor(
    @InjectRepository(Payments)
    private readonly paymentsRepository: Repository<Payments>,
  ) {}

  create(createPaymentsDto: CreatePaymentsDto) {
    const newPayment = this.paymentsRepository.create(createPaymentsDto);
    return this.paymentsRepository.save(newPayment);
  }

  findAll() {
    return this.paymentsRepository.find();
  }

  async findOne(id: string) {
    const payment = await this.paymentsRepository.findOne({
      where: { id },
    });
    if (!payment) {
      throw new NotFoundException(`Payment with id ${id} not found`);
    }
    return payment;
  }

  update(id: string, updatePaymentsDto: UpdatePaymentsDto) {
    return this.paymentsRepository.update(id, updatePaymentsDto);
  }

  remove(id: string) {
    return this.paymentsRepository.delete(id);
  }
}
