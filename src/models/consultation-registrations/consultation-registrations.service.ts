import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { CreateConsultationRegistrationDto } from './dto/create-consultation-registration.dto';
import { ConsultationRegistration } from './entities/consultation-registration.entity';

@Injectable()
export class ConsultationRegistrationsService {
  constructor(
    @InjectRepository(ConsultationRegistration)
    private readonly registrationRepository: Repository<ConsultationRegistration>,
  ) {}

  async create(createDto: CreateConsultationRegistrationDto): Promise<ConsultationRegistration> {
    const newRegistration = this.registrationRepository.create(createDto);
    return await this.registrationRepository.save(newRegistration);
  }

  async findAll(): Promise<ConsultationRegistration[]> {
    // Tui sort theo created_at giảm dần (DESC) để đơn mới nhất hiển thị lên đầu
    return await this.registrationRepository.find({
      order: { createdAt: 'DESC' },
      relations: ['product'], // Kéo kèm luôn thông tin product nếu có
    });
  }

  async findOne(id: string): Promise<ConsultationRegistration> {
    const registration = await this.registrationRepository.findOne({
      where: { id },
      relations: ['product'],
    });

    if (!registration) {
      throw new NotFoundException(`Consultation Registration with id ${id} not found`);
    }

    return registration;
  }

  async remove(id: string): Promise<void> {
    const registration = await this.findOne(id);
    await this.registrationRepository.remove(registration);
  }
}