import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { CreateVipLevelDto } from './dto/create-vip-level.dto';
import { UpdateVipLevelDto } from './dto/update-vip-level.dto';
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

  @Get('levels/all')
  @ApiOperation({ summary: 'Get all VIP levels including inactive levels' })
  getAllVipLevels() {
    return this.vipService.getAllVipLevels();
  }

  @Get('levels/:id')
  @ApiOperation({ summary: 'Get one VIP level by id' })
  getVipLevelById(@Param('id') id: string) {
    return this.vipService.getVipLevelById(id);
  }

  @Post('levels')
  @ApiOperation({ summary: 'Create a VIP level' })
  createVipLevel(@Body() createVipLevelDto: CreateVipLevelDto) {
    return this.vipService.createVipLevel(createVipLevelDto);
  }

  @Patch('levels/:id')
  @ApiOperation({ summary: 'Update a VIP level' })
  updateVipLevel(
    @Param('id') id: string,
    @Body() updateVipLevelDto: UpdateVipLevelDto,
  ) {
    return this.vipService.updateVipLevel(id, updateVipLevelDto);
  }

  @Delete('levels/:id')
  @ApiOperation({ summary: 'Soft delete a VIP level' })
  deleteVipLevel(@Param('id') id: string) {
    return this.vipService.deleteVipLevel(id);
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

  @Post('user/:userId/sync')
  @ApiOperation({ summary: 'Recalculate and update VIP level for one user' })
  syncUserVipProgress(@Param('userId') userId: string) {
    return this.vipService.syncUserVipProgress(userId);
  }

  @Post('users/sync')
  @ApiOperation({ summary: 'Recalculate and update VIP levels for all users' })
  syncAllUsersVipProgress() {
    return this.vipService.syncAllUsersVipProgress();
  }

  @Get('history/:userId')
  @ApiOperation({ summary: 'Get VIP level history of a user' })
  getVipHistoryByUser(@Param('userId') userId: string) {
    return this.vipService.getVipHistoryByUser(userId);
  }
}
