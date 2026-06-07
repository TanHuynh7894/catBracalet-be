import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, EntityManager, Repository } from 'typeorm';
import { VipLevel } from './entities/vip-level.entity';
import { VipHistory } from './entities/vip-history.entity';
import { User } from '../user/entities/user.entity';
import { Order } from '../orders/entities/order.entity';
import {
  VIP_ACCUMULATION_PERIOD,
  VIP_LEVEL_POLICIES,
} from './constants/vip-policy.constants';

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
    await this.syncVipPolicyLevels(this.vipLevelRepository);

    return await this.vipLevelRepository.find({
      where: { status: 'ACTIVE' },
      order: { minSpending: 'ASC' },
    });
  }

  // 2. getCurrentVipLevel(userId)
  async getCurrentVipLevel(userId: string) {
    await this.syncUserVipProgress(userId);

    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ['vipLevel'],
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user.vipLevel;
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

    await this.syncVipPolicyLevels(vipLevelRepository);

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

    const matchedVipLevel =
      accumulatedSpending > 0
        ? await vipLevelRepository
            .createQueryBuilder('vipLevel')
            .where('vipLevel.status = :status', { status: 'ACTIVE' })
            .andWhere('vipLevel.levelName IN (:...levelNames)', {
              levelNames: VIP_LEVEL_POLICIES.map((policy) => policy.levelName),
            })
            .andWhere('vipLevel.minSpending <= :accumulatedSpending', {
              accumulatedSpending,
            })
            .orderBy('vipLevel.minSpending', 'DESC')
            .getOne()
        : null;

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
          reason: `VIP progress synced for ${now.getFullYear()}`,
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

  private async syncVipPolicyLevels(vipLevelRepository: Repository<VipLevel>) {
    const policyLevelNames = VIP_LEVEL_POLICIES.map(
      (policy) => policy.levelName,
    );

    for (const policy of VIP_LEVEL_POLICIES) {
      const benefits = [
        `Minimum order amount: ${policy.minimumOrderAmount}`,
        policy.benefits,
      ].join('. ');

      const existingLevel = await vipLevelRepository.findOne({
        where: { levelName: policy.levelName },
      });

      if (existingLevel) {
        const shouldUpdate =
          Number(existingLevel.minSpending) !== policy.minSpending ||
          Number(existingLevel.discountPercent) !== policy.discountPercent ||
          existingLevel.benefits !== benefits ||
          existingLevel.status !== 'ACTIVE';

        if (shouldUpdate) {
          await vipLevelRepository.update(existingLevel.id, {
            minSpending: policy.minSpending,
            discountPercent: policy.discountPercent,
            benefits,
            status: 'ACTIVE',
          });
        }

        continue;
      }

      await vipLevelRepository.save(
        vipLevelRepository.create({
          levelName: policy.levelName,
          minSpending: policy.minSpending,
          discountPercent: policy.discountPercent,
          benefits,
          status: 'ACTIVE',
        }),
      );
    }

    await vipLevelRepository
      .createQueryBuilder()
      .update(VipLevel)
      .set({ status: 'INACTIVE' })
      .where('level_name NOT IN (:...policyLevelNames)', { policyLevelNames })
      .andWhere('status = :status', { status: 'ACTIVE' })
      .execute();
  }

  // 3. setUserVipLevel(userId, vipLevelId)
  async setUserVipLevel(userId: string, vipLevelId: string, reason?: string) {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const newLevel = await this.vipLevelRepository.findOne({
      where: { id: vipLevelId },
    });
    if (!newLevel) {
      throw new NotFoundException('VIP Level not found');
    }

    const oldLevelId = user.vipLevelId;

    // Update user direct to DB
    await this.userRepository.update(userId, {
      vipLevelId: vipLevelId,
      vipUpdatedAt: new Date(),
    });

    // 4. createVipHistory() - integrated logic
    await this.createVipHistory(
      userId,
      oldLevelId,
      vipLevelId,
      reason || 'Manual update',
    );

    const updatedUser = await this.userRepository.findOne({
      where: { id: userId },
      relations: ['vipLevel'],
    });

    return updatedUser?.vipLevel ?? null;
  }

  // 4. createVipHistory()
  async createVipHistory(
    userId: string,
    oldLevelId: string,
    newLevelId: string,
    reason: string,
  ) {
    const history = this.vipHistoryRepository.create({
      userId,
      oldLevelId,
      newLevelId,
      reason,
    });
    return await this.vipHistoryRepository.save(history);
  }

  // 5. getVipHistoryByUser(userId)
  async getVipHistoryByUser(userId: string) {
    return await this.vipHistoryRepository.find({
      where: { userId },
      relations: ['oldLevel', 'newLevel'],
      order: { changedAt: 'DESC' },
    });
  }
}
