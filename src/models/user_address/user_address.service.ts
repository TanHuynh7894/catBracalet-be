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

    address.status = 'INACTIVE';
    await this.userAddressRepository.save(address);
    return { message: 'Address successfully deactivated' };
  }
}
