import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, EntityManager, Repository } from 'typeorm';
import { VipLevel } from './entities/vip-level.entity';
import { VipHistory } from './entities/vip-history.entity';
import { User } from '../user/entities/user.entity';
import { Order } from '../orders/entities/order.entity';
import { VIP_ACCUMULATION_PERIOD } from './constants/vip-policy.constants';
import { CreateVipLevelDto } from './dto/create-vip-level.dto';
import { UpdateVipLevelDto } from './dto/update-vip-level.dto';

@Injectable()
export class VipService {
  constructor(
    @InjectRepository(VipLevel)
    private readonly vipLevelRepository: Repository<VipLevel>,
    @InjectRepository(VipHistory)
    private readonly vipHistoryRepository: Repository<VipHistory>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly dataSource: DataSource,
  ) {}

  // 1. getVipLevels()
  async getVipLevels() {
    return await this.vipLevelRepository.find({
      where: { status: 'ACTIVE' },
      order: { minSpending: 'ASC' },
    });
  }

  async getAllVipLevels() {
    return this.vipLevelRepository.find({
      order: { minSpending: 'ASC' },
    });
  }

  async getVipLevelById(id: string) {
    const vipLevel = await this.vipLevelRepository.findOne({
      where: { id },
    });
    if (!vipLevel) {
      throw new NotFoundException(`VIP level with id ${id} not found`);
    }

    return vipLevel;
  }

  async createVipLevel(createVipLevelDto: CreateVipLevelDto) {
    await this.ensureUniqueLevelName(createVipLevelDto.levelName);

    const vipLevel = this.vipLevelRepository.create({
      ...createVipLevelDto,
      status: createVipLevelDto.status ?? 'ACTIVE',
    });
    const savedLevel = await this.vipLevelRepository.save(vipLevel);

    await this.syncAllUsersVipProgress();

    return savedLevel;
  }

  async updateVipLevel(id: string, updateVipLevelDto: UpdateVipLevelDto) {
    const vipLevel = await this.getVipLevelById(id);

    if (
      updateVipLevelDto.levelName &&
      updateVipLevelDto.levelName !== vipLevel.levelName
    ) {
      await this.ensureUniqueLevelName(updateVipLevelDto.levelName, id);
    }

    await this.vipLevelRepository.update(id, updateVipLevelDto);
    const updatedLevel = await this.getVipLevelById(id);

    await this.syncAllUsersVipProgress();

    return updatedLevel;
  }

  async deleteVipLevel(id: string) {
    const vipLevel = await this.getVipLevelById(id);

    if (vipLevel.status === 'INACTIVE') {
      return vipLevel;
    }

    await this.vipLevelRepository.update(id, { status: 'INACTIVE' });
    const deletedLevel = await this.getVipLevelById(id);

    await this.syncAllUsersVipProgress();

    return deletedLevel;
  }

  // 2. getCurrentVipLevel(userId)
  async getCurrentVipLevel(userId: string) {
    const result = await this.syncUserVipProgress(userId);
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ['vipLevel'],
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return {
      userId,
      totalSpending: result.totalSpending,
      vipLevelId: result.vipLevelId,
      vipLevel: user.vipLevel,
    };
  }

  async getUserVipProgress(userId: string) {
    const progress = await this.syncUserVipProgress(userId);
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ['vipLevel'],
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const levels = await this.getVipLevels();
    const currentLevelIndex = levels.findIndex(
      (level) => level.id === user.vipLevelId,
    );
    const nextLevel =
      currentLevelIndex >= 0 ? levels[currentLevelIndex + 1] : levels[0];
    const amountToNextLevel = nextLevel
      ? Math.max(0, Number(nextLevel.minSpending) - progress.totalSpending)
      : 0;

    return {
      userId,
      totalSpending: progress.totalSpending,
      accumulationPeriod: progress.accumulationPeriod,
      year: progress.year,
      windowStart: progress.windowStart,
      windowEnd: progress.windowEnd,
      currentLevel: user.vipLevel,
      nextLevel,
      amountToNextLevel,
    };
  }

  async syncUserVipProgress(userId: string, manager?: EntityManager) {
    const entityManager = manager ?? this.dataSource.manager;
    const userRepository = entityManager.getRepository(User);
    const vipLevelRepository = entityManager.getRepository(VipLevel);
    const vipHistoryRepository = entityManager.getRepository(VipHistory);

    await this.normalizeVipHistoryReasons(vipHistoryRepository);

    const user = await userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const now = new Date();
    const windowStart = new Date(now.getFullYear(), 0, 1);
    const windowEnd = new Date(now.getFullYear() + 1, 0, 1);

    const spendingResult = await entityManager
      .getRepository(Order)
      .createQueryBuilder('order')
      .select('COALESCE(SUM(order.totalAmount), 0)', 'total')
      .where('order.userId = :userId', { userId })
      .andWhere('order.status = :status', { status: 'DELIVERED' })
      .andWhere('order.createdAt >= :windowStart', { windowStart })
      .andWhere('order.createdAt < :windowEnd', { windowEnd })
      .getRawOne<{ total: string }>();

    const accumulatedSpending = Number(spendingResult?.total ?? 0);

    const matchedVipLevel = await this.findVipLevelBySpending(
      vipLevelRepository,
      accumulatedSpending,
    );

    const oldVipLevelId = user.vipLevelId ?? null;
    const newVipLevelId = matchedVipLevel?.id ?? null;

    await userRepository.update(userId, {
      totalSpending: accumulatedSpending,
      vipLevelId: newVipLevelId,
      vipUpdatedAt:
        oldVipLevelId !== newVipLevelId ? new Date() : user.vipUpdatedAt,
    });

    if (oldVipLevelId !== newVipLevelId) {
      await vipHistoryRepository.save(
        vipHistoryRepository.create({
          userId,
          oldLevelId: oldVipLevelId,
          newLevelId: newVipLevelId,
          reason: 'Mua đủ để thăng tiến lên',
        }),
      );
    }

    return {
      userId,
      accumulationPeriod: VIP_ACCUMULATION_PERIOD,
      year: now.getFullYear(),
      windowStart,
      windowEnd,
      totalSpending: accumulatedSpending,
      vipLevelId: newVipLevelId,
    };
  }

  async syncUserAnnualSpending(userId: string, manager?: EntityManager) {
    return this.syncUserVipProgress(userId, manager);
  }

  async updateVipLevelFromTotalSpending(
    userId: string,
    manager?: EntityManager,
  ) {
    const entityManager = manager ?? this.dataSource.manager;
    const userRepository = entityManager.getRepository(User);
    const vipLevelRepository = entityManager.getRepository(VipLevel);
    const vipHistoryRepository = entityManager.getRepository(VipHistory);

    const user = await userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const currentTotalSpending = Number(user.totalSpending ?? 0);
    const matchedVipLevel = await this.findVipLevelBySpending(
      vipLevelRepository,
      currentTotalSpending,
    );

    const oldVipLevelId = user.vipLevelId ?? null;
    const newVipLevelId = matchedVipLevel?.id ?? null;

    if (oldVipLevelId !== newVipLevelId) {
      await userRepository.update(userId, {
        vipLevelId: newVipLevelId,
        vipUpdatedAt: new Date(),
      });

      await vipHistoryRepository.save(
        vipHistoryRepository.create({
          userId,
          oldLevelId: oldVipLevelId,
          newLevelId: newVipLevelId,
          reason: 'Mua đủ để thăng tiến lên',
        }),
      );
    }

    return {
      userId,
      totalSpending: currentTotalSpending,
      vipLevelId: newVipLevelId,
      vipLevel: matchedVipLevel,
    };
  }

  private async findVipLevelBySpending(
    vipLevelRepository: Repository<VipLevel>,
    totalSpending: number,
  ) {
    if (totalSpending <= 0) {
      return null;
    }

    return vipLevelRepository
      .createQueryBuilder('vipLevel')
      .where('vipLevel.status = :status', { status: 'ACTIVE' })
      .andWhere('vipLevel.minSpending <= :totalSpending', { totalSpending })
      .orderBy('vipLevel.minSpending', 'DESC')
      .getOne();
  }

  private async normalizeVipHistoryReasons(
    vipHistoryRepository: Repository<VipHistory>,
  ) {
    await vipHistoryRepository
      .createQueryBuilder()
      .update(VipHistory)
      .set({ reason: 'Mua đủ để thăng tiến lên' })
      .where('reason LIKE :reason', { reason: 'VIP progress synced%' })
      .execute();
  }

  // 3. getVipHistoryByUser(userId)
  async getVipHistoryByUser(userId: string) {
    await this.normalizeVipHistoryReasons(this.vipHistoryRepository);

    return await this.vipHistoryRepository.find({
      where: { userId },
      relations: ['oldLevel', 'newLevel'],
      order: { changedAt: 'DESC' },
    });
  }

  async syncAllUsersVipProgress() {
    const users = await this.userRepository.find({
      select: { id: true },
      where: { status: 'ACTIVE' },
    });

    const results = [];
    for (const user of users) {
      results.push(await this.syncUserVipProgress(user.id));
    }

    return {
      syncedUsers: results.length,
      results,
    };
  }

  private async ensureUniqueLevelName(levelName: string, excludeId?: string) {
    const existingLevel = await this.vipLevelRepository.findOne({
      where: { levelName },
    });

    if (existingLevel && existingLevel.id !== excludeId) {
      throw new BadRequestException(`VIP level ${levelName} already exists`);
    }
  }
}
