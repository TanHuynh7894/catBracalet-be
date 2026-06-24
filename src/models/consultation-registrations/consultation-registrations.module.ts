import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConsultationRegistrationsService } from './consultation-registrations.service';
import { ConsultationRegistrationsController } from './consultation-registrations.controller';
import { ConsultationRegistration } from './entities/consultation-registration.entity';

@Module({
  // Bắt buộc phải có dòng này!
  imports: [TypeOrmModule.forFeature([ConsultationRegistration])],
  controllers: [ConsultationRegistrationsController],
  providers: [ConsultationRegistrationsService],
})
export class ConsultationRegistrationsModule {}
