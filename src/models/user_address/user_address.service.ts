import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateUserAddressDto } from './dto/create-user-address.dto';
import { UpdateUserAddressDto } from './dto/update-user-address.dto';
import { UserAddress } from './entities/user_address.entity';
import { User } from '../user/entities/user.entity';

@Injectable()
export class UserAddressService {
  constructor(
    @InjectRepository(UserAddress)
    private readonly userAddressRepository: Repository<UserAddress>,

    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) { }

  private async verifyUserExists(userId: string): Promise<void> {
    const userExists = await this.userRepository.findOneBy({ id: userId });
    if (!userExists) {
      throw new NotFoundException(`User with id ${userId} not found`);
    }
  }

  async createAddressForUser(userId: string, createUserAddressDto: CreateUserAddressDto): Promise<UserAddress> {
    await this.verifyUserExists(userId);

    // If setting as default, unset previous default addresses
    if (createUserAddressDto.isDefault) {
      await this.userAddressRepository.update({ userId }, { isDefault: false });
    } else {
      // If user has no existing ACTIVE addresses, set this first one as default automatically
      const count = await this.userAddressRepository.count({ where: { userId, status: 'ACTIVE' } });
      if (count === 0) {
        createUserAddressDto.isDefault = true;
      }
    }

    const newAddress = this.userAddressRepository.create({
      ...createUserAddressDto,
      userId,
    });
    return this.userAddressRepository.save(newAddress);
  }

  async getAddressesByUser(userId: string): Promise<UserAddress[]> {
    await this.verifyUserExists(userId);

    return this.userAddressRepository.find({
      where: { userId, status: 'ACTIVE' },
      order: { isDefault: 'DESC' }, // Show default address first
    });
  }

  async updateAddressForUser(
    userId: string,
    addressId: string,
    updateUserAddressDto: UpdateUserAddressDto,
  ): Promise<UserAddress> {
    await this.verifyUserExists(userId);

    const address = await this.userAddressRepository.findOne({
      where: { id: addressId, userId },
    });
    if (!address) {
      throw new NotFoundException(`Address with id ${addressId} not found for this user`);
    }

    if (updateUserAddressDto.isDefault) {
      await this.userAddressRepository.update({ userId }, { isDefault: false });
    }

    Object.assign(address, updateUserAddressDto);
    return this.userAddressRepository.save(address);
  }

  async deleteAddressForUser(userId: string, addressId: string): Promise<{ message: string }> {
    await this.verifyUserExists(userId);

    const address = await this.userAddressRepository.findOne({
      where: { id: addressId, userId },
    });
    if (!address) {
      throw new NotFoundException(`Address with id ${addressId} not found for this user`);
    }

    const wasDefault = address.isDefault;
    address.status = 'INACTIVE';
    address.isDefault = false; // "Deleted" address shouldn't be default
    await this.userAddressRepository.save(address);

    // If we deactivated the default address, set another ACTIVE address as default if any exists
    if (wasDefault) {
      const remainingAddress = await this.userAddressRepository.findOne({
        where: { userId, status: 'ACTIVE' },
      });
      if (remainingAddress) {
        remainingAddress.isDefault = true;
        await this.userAddressRepository.save(remainingAddress);
      }
    }

    return { message: 'Address successfully deactivated' };
  }

  async setDefaultAddressForUser(userId: string, addressId: string): Promise<UserAddress> {
    await this.verifyUserExists(userId);

    const address = await this.userAddressRepository.findOne({
      where: { id: addressId, userId, status: 'ACTIVE' },
    });
    if (!address) {
      throw new NotFoundException(`Active Address with id ${addressId} not found for this user`);
    }

    // Set all user's addresses to not default
    await this.userAddressRepository.update({ userId }, { isDefault: false });

    // Mark current one as default
    address.isDefault = true;
    return this.userAddressRepository.save(address);
  }
}
