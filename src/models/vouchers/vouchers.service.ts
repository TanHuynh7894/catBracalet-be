import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateVouchersDto } from './dto/create-vouchers.dto';
import { UpdateVouchersDto } from './dto/update-vouchers.dto';
import { Vouchers } from './entities/vouchers.entity';

@Injectable()
export class VouchersService {
  constructor(
    @InjectRepository(Vouchers)
    private readonly vouchersRepository: Repository<Vouchers>,
  ) { }

  create(createVouchersDto: CreateVouchersDto) {
    const newVoucher = this.vouchersRepository.create(createVouchersDto);
    return this.vouchersRepository.save(newVoucher);
  }

  findAll() {
    return this.vouchersRepository.find();
  }

  async findOne(id: string) {
    const voucher = await this.vouchersRepository.findOne({
      where: { id },
    });
    if (!voucher) {
      throw new NotFoundException(`Voucher with id ${id} not found`);
    }
    return voucher;
  }

  update(id: string, updateVouchersDto: UpdateVouchersDto) {
    return this.vouchersRepository.update(id, updateVouchersDto);
  }

  async remove(id: string) {
    const voucher = await this.findOne(id);
    voucher.status = 'INACTIVE';
    return this.vouchersRepository.save(voucher);
  }
}
