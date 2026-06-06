import { PartialType } from '@nestjs/swagger';
import { CreateConsultationRegistrationDto } from './create-consultation-registration.dto';

export class UpdateConsultationRegistrationDto extends PartialType(CreateConsultationRegistrationDto) {}
