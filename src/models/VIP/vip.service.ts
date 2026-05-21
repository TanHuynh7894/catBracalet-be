import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { VipLevel } from './entities/vip-level.entity';
import { VipHistory } from './entities/vip-history.entity';
import { User } from '../user/entities/user.entity';

@Injectable()
export class VipService {
    constructor(
        @InjectRepository(VipLevel)
        private readonly vipLevelRepository: Repository<VipLevel>,
        @InjectRepository(VipHistory)
        private readonly vipHistoryRepository: Repository<VipHistory>,
        @InjectRepository(User)
        private readonly userRepository: Repository<User>,
    ) { }

    // 1. getVipLevels()
    async getVipLevels() {
        return await this.vipLevelRepository.find({
            where: { status: 'ACTIVE' },
            order: { minSpending: 'ASC' },
        });
    }

    // 2. getCurrentVipLevel(userId)
    async getCurrentVipLevel(userId: string) {
        const user = await this.userRepository.findOne({
            where: { id: userId },
            relations: ['vipLevel'],
        });

        if (!user) {
            throw new NotFoundException('User not found');
        }

        return user.vipLevel;
    }

    // 3. setUserVipLevel(userId, vipLevelId)
    async setUserVipLevel(userId: string, vipLevelId: string, reason?: string) {
        const user = await this.userRepository.findOne({ where: { id: userId } });
        if (!user) {
            throw new NotFoundException('User not found');
        }

        const newLevel = await this.vipLevelRepository.findOne({ where: { id: vipLevelId } });
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
        await this.createVipHistory(userId, oldLevelId, vipLevelId, reason || 'Manual update');

        // Re-fetch to return the latest status (newLevel)
        return await this.getCurrentVipLevel(userId);
    }

    // 4. createVipHistory()
    async createVipHistory(userId: string, oldLevelId: string, newLevelId: string, reason: string) {
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
