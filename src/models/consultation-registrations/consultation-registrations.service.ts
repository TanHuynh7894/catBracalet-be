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

  async create(
    createDto: CreateConsultationRegistrationDto,
  ): Promise<ConsultationRegistration> {
    const newRegistration = this.registrationRepository.create(createDto);
    return await this.registrationRepository.save(newRegistration);
  }

  async findAll(): Promise<ConsultationRegistration[]> {
    return await this.registrationRepository.find({
      order: { createdAt: 'DESC' },
      relations: ['product'],
    });
  }

  async findOne(id: string): Promise<ConsultationRegistration> {
    const registration = await this.registrationRepository.findOne({
      where: { id },
      relations: ['product'],
    });

    if (!registration) {
      throw new NotFoundException(
        `Consultation Registration with id ${id} not found`,
      );
    }

    return registration;
  }

  async remove(id: string): Promise<void> {
    const registration = await this.findOne(id);
    await this.registrationRepository.remove(registration);
  }
}
