import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  Repository,
  EntityManager,
  Between,
  MoreThan,
  LessThanOrEqual,
} from 'typeorm';
import { CreateVouchersDto } from './dto/create-vouchers.dto';
import { UpdateVouchersDto } from './dto/update-vouchers.dto';
import { Vouchers } from './entities/vouchers.entity';

@Injectable()
export class VouchersService {
  constructor(
    @InjectRepository(Vouchers)
    private readonly vouchersRepository: Repository<Vouchers>,
  ) {}

  async validateVoucher(code: string, manager?: EntityManager) {
    const repo = manager
      ? manager.getRepository(Vouchers)
      : this.vouchersRepository;
    const voucher = await repo.findOne({ where: { code, status: 'ACTIVE' } });

    if (!voucher) {
      throw new BadRequestException(
        'Mã giảm giá không tồn tại hoặc đã bị vô hiệu hóa',
      );
    }

    const now = new Date();
    if (now < voucher.startDate || now > voucher.endDate) {
      throw new BadRequestException(
        'Mã giảm giá đã hết hạn hoặc chưa đến thời gian sử dụng',
      );
    }

    if (voucher.quantity <= 0) {
      throw new BadRequestException('Mã giảm giá đã hết lượt sử dụng');
    }

    return voucher;
  }

  calculateVoucherDiscount(subtotal: number, voucher: Vouchers): number {
    let discount = 0;
    if (voucher.discountType === 'PERCENT') {
      discount = subtotal * (Number(voucher.discountValue) / 100);
    } else if (voucher.discountType === 'FIXED') {
      discount = Number(voucher.discountValue);
    }

    return Math.min(subtotal, Math.max(0, discount));
  }

  async decrementVoucherQuantity(id: string, manager: EntityManager) {
    await manager.decrement(Vouchers, { id }, 'quantity', 1);
  }

  async rollbackVoucher(id: string, manager: EntityManager) {
    await manager.increment(Vouchers, { id }, 'quantity', 1);
  }

  create(createVouchersDto: CreateVouchersDto) {
    const newVoucher = this.vouchersRepository.create(createVouchersDto);
    return this.vouchersRepository.save(newVoucher);
  }

  findAll() {
    return this.vouchersRepository.find({ order: { startDate: 'DESC' } });
  }

  async findOne(id: string) {
    const voucher = await this.vouchersRepository.findOne({ where: { id } });
    if (!voucher) throw new NotFoundException(`Voucher ID ${id} không tồn tại`);
    return voucher;
  }

  async getVoucherByCode(code: string) {
    const voucher = await this.vouchersRepository.findOne({ where: { code } });
    if (!voucher) throw new NotFoundException(`Mã code ${code} không tồn tại`);
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


  filterByStatus(status: string) {
    return this.vouchersRepository.find({ where: { status } });
  }

  filterByValueRange(minValue: number, maxValue: number) {
    return this.vouchersRepository.find({
      where: { discountValue: Between(minValue, maxValue) },
    });
  }

  filterByDateRange(start: Date, end: Date) {
    return this.vouchersRepository.find({
      where: [
        { startDate: Between(start, end) },
        { endDate: Between(start, end) },
      ],
    });
  }
}
