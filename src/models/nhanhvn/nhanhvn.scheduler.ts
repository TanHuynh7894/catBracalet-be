import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class NhanhvnScheduler {
  private readonly logger = new Logger(NhanhvnScheduler.name);

  syncInventoryJob() {
    this.logger.log('Nhanh.vn inventory sync job triggered');
    return {
      success: true,
      message: 'Nhanh.vn inventory sync job triggered',
    };
  }
}
