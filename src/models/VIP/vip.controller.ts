import { Controller, Get, Param } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { VipService } from './vip.service';

@ApiTags('VIP')
@Controller('vip')
export class VipController {
  constructor(private readonly vipService: VipService) {}

  @Get('levels')
  @ApiOperation({ summary: 'Get all active VIP levels' })
  getVipLevels() {
    return this.vipService.getVipLevels();
  }

  @Get('user/:userId')
  @ApiOperation({ summary: 'Get current VIP level of a user' })
  getCurrentVipLevel(@Param('userId') userId: string) {
    return this.vipService.getCurrentVipLevel(userId);
  }

  @Get('user/:userId/progress')
  @ApiOperation({
    summary: 'Get yearly VIP progress',
  })
  getUserVipProgress(@Param('userId') userId: string) {
    return this.vipService.getUserVipProgress(userId);
  }

  @Get('history/:userId')
  @ApiOperation({ summary: 'Get VIP level history of a user' })
  getVipHistoryByUser(@Param('userId') userId: string) {
    return this.vipService.getVipHistoryByUser(userId);
  }
}
