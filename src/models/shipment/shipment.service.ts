import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { isAxiosError } from 'axios';
import { firstValueFrom } from 'rxjs';
import { Repository } from 'typeorm';
import * as fs from 'fs';
import * as path from 'path';

import { Order } from '../orders/entities/order.entity';
import { UserAddress } from '../user_address/entities/user_address.entity';
import { VipService } from '../VIP/vip.service';
import { Shipment } from './entities/shipment.entity';
import { AdminCreateShipmentDto } from './dto/admin-create-shipment.dto';
import { CalculateAddressFeeDto } from './dto/calculate-address-fee.dto';
import { CalculateFeeDto } from './dto/calculate-fee.dto';
import { CalculateOrderRatesDto } from './dto/calculate-order-rates.dto';
import { GoshipWebhookDto } from './dto/goship-webhook.dto';

export interface GoshipProvince {
  id: string;
  name: string;
}

export interface GoshipDistrict {
  id: string;
  province_id: string;
  name: string;
}

export interface GoshipWard {
  id: string;
  district_id: string;
  name: string;
}

type ParcelOptions = Omit<CalculateFeeDto, 'city' | 'district' | 'ward'>;

interface GoshipRateResponse {
  id: string;
  carrier_name: string;
  carrier_logo?: string;
  service?: string;
  service_name?: string;
  expected?: string;
  expected_txt?: string;
  cod_fee?: number;
  total_fee: number;
  total_amount?: number;
}

type GoshipObject = Record<string, unknown>;

@Injectable()
export class ShipmentService {
  private provinces: GoshipProvince[] = [];
  private districts: GoshipDistrict[] = [];
  private wards: GoshipWard[] = [];

  constructor(
    @InjectRepository(Shipment)
    private readonly shipmentRepository: Repository<Shipment>,
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,
    @InjectRepository(UserAddress)
    private readonly userAddressRepository: Repository<UserAddress>,
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
    private readonly vipService: VipService,
  ) {
    this.loadLocalData();
  }

  private loadLocalData(): void {
    const candidateDirs = [
      path.join(process.cwd(), 'src', 'models', 'shipment', 'data'),
      path.join(process.cwd(), 'dist', 'models', 'shipment', 'data'),
      path.join(process.cwd(), 'data'),
    ];

    const dataDir = candidateDirs.find((dir) =>
      fs.existsSync(path.join(dir, 'provinces_goship.json')),
    );

    if (!dataDir) {
      console.warn('[GOSHIP] Local address data directory was not found');
      return;
    }

    this.provinces = this.normalizeProvinces(
      this.readJsonFile<unknown[]>(
        path.join(dataDir, 'provinces_goship.json'),
        [],
      ),
    );
    this.districts = this.normalizeDistricts(
      this.readJsonFile<unknown[]>(
        path.join(dataDir, 'districts_goship.json'),
        [],
      ),
    );
    this.wards = this.normalizeWards(
      this.readJsonFile<unknown[]>(path.join(dataDir, 'wards_goship.json'), []),
    );
  }

  private readJsonFile<T>(filePath: string, fallback: T): T {
    try {
      if (!fs.existsSync(filePath)) return fallback;
      return JSON.parse(fs.readFileSync(filePath, 'utf8')) as T;
    } catch (error) {
      console.error(`[GOSHIP] Failed to read ${filePath}:`, error);
      return fallback;
    }
  }

  private normalizeProvinces(items: unknown[]): GoshipProvince[] {
    return items
      .filter((item): item is GoshipObject => this.isRecord(item))
      .map((item) => ({
        id: this.normalizeString(item.id),
        name: this.normalizeString(item.name),
      }))
      .filter((item) => item.id && item.name);
  }

  private normalizeDistricts(
    items: unknown[],
    fallbackProvinceId?: string,
  ): GoshipDistrict[] {
    return items
      .filter((item): item is GoshipObject => this.isRecord(item))
      .map((item) => ({
        id: this.normalizeString(item.id),
        province_id:
          this.normalizeString(item.province_id) ||
          this.normalizeString(item.city_id) ||
          fallbackProvinceId ||
          '',
        name: this.normalizeString(item.name),
      }))
      .filter((item) => item.id && item.province_id && item.name);
  }

  private normalizeWards(
    items: unknown[],
    fallbackDistrictId?: string,
  ): GoshipWard[] {
    return items
      .filter((item): item is GoshipObject => this.isRecord(item))
      .map((item) => ({
        id: this.normalizeString(item.id),
        district_id:
          this.normalizeString(item.district_id) || fallbackDistrictId || '',
        name: this.normalizeString(item.name),
      }))
      .filter((item) => item.id && item.district_id && item.name);
  }

  async getProvinces(): Promise<GoshipProvince[]> {
    try {
      const response = await this.getFromGoship('/cities');
      const cities = this.extractGoshipData<unknown[]>(response, []);
      const normalized = this.normalizeProvinces(cities);
      if (normalized.length) {
        this.provinces = normalized;
        return normalized;
      }
    } catch (error) {
      console.warn('[GOSHIP] Falling back to local province data:', error);
    }

    return this.provinces;
  }

  async getDistricts(provinceId: string): Promise<GoshipDistrict[]> {
    const cityId = String(provinceId);

    try {
      const response = await this.getFromGoship(`/cities/${cityId}/districts`);
      const districts = this.extractGoshipData<unknown[]>(response, []);
      const normalized = this.normalizeDistricts(districts, cityId);
      if (normalized.length) {
        this.districts = [
          ...this.districts.filter(
            (district) => district.province_id !== cityId,
          ),
          ...normalized,
        ];
        return normalized;
      }
    } catch (error) {
      console.warn('[GOSHIP] Falling back to local district data:', error);
    }

    return this.districts.filter((district) => district.province_id === cityId);
  }

  async getWards(districtId: string): Promise<GoshipWard[]> {
    const code = String(districtId);

    try {
      const response = await this.getFromGoship(`/districts/${code}/wards`);
      const wards = this.extractGoshipData<unknown[]>(response, []);
      const normalized = this.normalizeWards(wards, code);
      if (normalized.length) {
        this.wards = [
          ...this.wards.filter((ward) => ward.district_id !== code),
          ...normalized,
        ];
        return normalized;
      }
    } catch (error) {
      console.warn('[GOSHIP] Falling back to local ward data:', error);
    }

    return this.wards.filter((ward) => ward.district_id === code);
  }

  async calculateFeeForClient(dto: CalculateFeeDto) {
    const adminRates = await this.calculateFeeForAdmin(dto);

    if (!adminRates.length) {
      throw new BadRequestException(
        'Goship did not return any available shipping rates',
      );
    }

    const totalFees = adminRates.map((rate) => Number(rate.total_fee));
    const averageFee =
      totalFees.reduce((sum, fee) => sum + fee, 0) / totalFees.length;
    const highestFee = Math.max(...totalFees);
    const markupFee = highestFee * 0.1;
    const customerShippingFee = Math.round(averageFee + markupFee);

    return {
      rate_count: adminRates.length,
      average_shipping_fee: Math.round(averageFee),
      highest_shipping_fee: highestFee,
      markup_fee: Math.round(markupFee),
      total_shipping_fee: customerShippingFee,
      total_amount_to_pay: customerShippingFee,
    };
  }

  async calculateFeeForClientAddress(dto: CalculateAddressFeeDto) {
    const address = await this.userAddressRepository.findOne({
      where: { id: dto.addressId, status: 'ACTIVE' },
    });

    if (!address) {
      throw new NotFoundException(
        `Active address with id ${dto.addressId} not found`,
      );
    }

    return this.calculateFeeForAddress(address);
  }

  async calculateFeeForAddress(
    address: Pick<UserAddress, 'province' | 'district' | 'ward'>,
    parcel: Omit<CalculateFeeDto, 'city' | 'district' | 'ward'> = {},
  ) {
    const destinationAddress = await this.resolveAddressCodes(
      address.province,
      address.district,
      address.ward,
    );

    return this.calculateFeeForClient({
      ...parcel,
      city: destinationAddress.city,
      district: destinationAddress.district,
      ward: destinationAddress.ward,
    });
  }

  async calculateFeeForAdmin(dto: CalculateFeeDto) {
    await this.validateDestinationCodes(dto.city, dto.district, dto.ward);

    const payload = {
      shipment: {
        address_from: {
          city: this.getSenderCity(),
          district: this.getSenderDistrict(),
        },
        address_to: {
          city: dto.city,
          district: dto.district,
        },
        parcel: {
          cod: dto.cod ?? 0,
          amount: dto.amount ?? 0,
          width: dto.width ?? 10,
          height: dto.height ?? 10,
          length: dto.length ?? 10,
          weight: dto.weight ?? 500,
        },
      },
    };

    const response = await this.postToGoship('/rates', payload);
    const rates = this.extractGoshipData<GoshipRateResponse[]>(response, []);

    return rates.map((rate) => ({
      id: rate.id,
      carrier_name: rate.carrier_name,
      carrier_logo: rate.carrier_logo,
      service: rate.service ?? rate.service_name,
      expected: rate.expected ?? rate.expected_txt,
      cod_fee: Number(rate.cod_fee ?? 0),
      total_fee: Number(rate.total_fee ?? 0),
      total_amount: Number(rate.total_amount ?? rate.total_fee ?? 0),
    }));
  }

  async calculateRatesForOrder(orderId: string, dto: CalculateOrderRatesDto) {
    const order = await this.orderRepository.findOne({
      where: { id: orderId },
      relations: ['address', 'items'],
    });

    if (!order) {
      throw new NotFoundException(`Order with id ${orderId} not found`);
    }

    if (order.status !== 'CONFIRMED') {
      throw new BadRequestException(
        `Cannot calculate shipment rates for order with status ${order.status}`,
      );
    }

    if (!order.address) {
      throw new BadRequestException('Order does not have a shipping address');
    }

    const destinationAddress = await this.resolveAddressCodes(
      order.address.province,
      order.address.district,
      order.address.ward,
    );

    const declaredAmount = this.getOrderDeclaredAmount(order);
    const rates = await this.calculateFeeForAdmin({
      ...dto,
      amount: declaredAmount,
      city: destinationAddress.city,
      district: destinationAddress.district,
      ward: destinationAddress.ward,
    });

    return {
      orderId: order.id,
      status: order.status,
      declaredAmount,
      destination: destinationAddress,
      rates,
    };
  }

  async createShipment(dto: AdminCreateShipmentDto) {
    const order = await this.orderRepository.findOne({
      where: { id: dto.orderId },
      relations: ['address', 'items'],
    });

    if (!order) {
      throw new NotFoundException(`Order with id ${dto.orderId} not found`);
    }

    if (order.status !== 'CONFIRMED') {
      throw new BadRequestException(
        `Cannot create shipment for order with status ${order.status}`,
      );
    }

    if (!order.address) {
      throw new BadRequestException('Order does not have a shipping address');
    }

    const destinationAddress = await this.resolveAddressCodes(
      order.address.province,
      order.address.district,
      order.address.ward,
    );

    const declaredAmount = this.getOrderDeclaredAmount(order);
    const payload = {
      shipment: {
        rate: dto.rateId,
        payer: dto.payer ?? 1,
        order_id: order.id,
        is_recall: 0,
        address_from: this.getSenderAddress(),
        address_to: {
          name: order.address.receiverName,
          phone: order.address.phone,
          street: order.address.detailAddress,
          ward: destinationAddress.ward,
          district: destinationAddress.district,
          city: destinationAddress.city,
        },
        parcel: {
          cod: dto.cod ?? 0,
          amount: declaredAmount,
          weight: dto.weight ?? 500,
          width: dto.width ?? 10,
          height: dto.height ?? 10,
          length: dto.length ?? 10,
          metadata: dto.note ?? 'Cat Bracelet order',
        },
      },
    };

    const response = await this.postToGoship('/shipments', payload);
    const goshipData = this.extractGoshipShipmentData(response);

    let shipment = await this.shipmentRepository.findOne({
      where: { orderId: dto.orderId },
    });

    const trackingCode =
      this.normalizeString(goshipData.tracking_number) ||
      this.normalizeString(goshipData.carrier_code) ||
      this.normalizeString(goshipData.code) ||
      this.normalizeString(goshipData.id);

    const shippingPartner =
      this.normalizeString(goshipData.carrier_short_name) ||
      this.normalizeString(goshipData.carrier) ||
      'GOSHIP';

    const shippingStatus =
      this.normalizeString(goshipData.shipment_status_txt) ||
      this.normalizeString(goshipData.status_text) ||
      'SHIPPING';

    if (!shipment) {
      shipment = this.shipmentRepository.create({
        orderId: dto.orderId,
        shippingPartner: shippingPartner.toUpperCase(),
        trackingCode,
        shippingStatus,
        shippedAt: new Date(),
      });
    } else {
      shipment.shippingPartner = shippingPartner.toUpperCase();
      shipment.trackingCode = trackingCode || shipment.trackingCode;
      shipment.shippingStatus = shippingStatus;
      shipment.shippedAt = shipment.shippedAt ?? new Date();
    }

    const savedShipment = await this.shipmentRepository.save(shipment);
    await this.syncOrderStatusFromGoship(
      savedShipment.orderId,
      savedShipment.shippingStatus,
    );

    return {
      success: true,
      shipmentId: savedShipment.id,
      orderId: savedShipment.orderId,
      trackingCode: savedShipment.trackingCode || '',
      shippingStatus: savedShipment.shippingStatus,
      goshipShipmentId: this.normalizeString(goshipData.id),
      raw: goshipData,
    };
  }

  async createShipmentForPaidOrder(orderId: string) {
    throw new BadRequestException(
      `Order ${orderId} must be shipped manually: confirm the order, calculate rates, then create shipment with the selected rateId`,
    );
  }

  private getOrderDeclaredAmount(order: Pick<Order, 'items' | 'totalAmount'>) {
    const itemsAmount = Math.round(
      (order.items ?? []).reduce(
        (sum, item) => sum + Number(item.totalPrice ?? 0),
        0,
      ),
    );

    return itemsAmount > 0
      ? itemsAmount
      : Math.round(Number(order.totalAmount ?? 0));
  }

  async trackShipment(orderId: string) {
    const shipment = await this.shipmentRepository.findOne({
      where: { orderId },
    });

    if (!shipment) {
      throw new NotFoundException(
        'No shipment tracking data was found for this order',
      );
    }

    return {
      orderId: shipment.orderId,
      trackingCode: shipment.trackingCode || 'Not assigned yet',
      carrier: shipment.shippingPartner,
      status: shipment.shippingStatus,
      updatedAt: shipment.deliveredAt || shipment.shippedAt || new Date(),
    };
  }

  async handleWebhook(webhookDto: GoshipWebhookDto): Promise<void> {
    const shipment = await this.shipmentRepository.findOne({
      where: { orderId: webhookDto.order_id },
    });

    if (!shipment) {
      throw new NotFoundException(
        `Shipment was not found for order id ${webhookDto.order_id}`,
      );
    }

    const pathTrackingCode = webhookDto.paths?.find(
      (item) => item.tracking_number,
    )?.tracking_number;

    const trackingCode =
      webhookDto.code ||
      pathTrackingCode ||
      webhookDto.gcode ||
      shipment.trackingCode;
    const statusText =
      webhookDto.status_text ||
      webhookDto.message ||
      webhookDto.description ||
      String(webhookDto.status ?? shipment.shippingStatus);

    shipment.trackingCode = trackingCode;
    shipment.shippingPartner =
      webhookDto.carrier_short_name?.toUpperCase() || shipment.shippingPartner;
    shipment.shippingStatus = statusText;

    const completedText = statusText.toLowerCase();
    if (
      completedText.includes('delivered') ||
      completedText.includes('completed') ||
      completedText.includes('thanh cong') ||
      completedText.includes('da giao')
    ) {
      shipment.deliveredAt = new Date();
    }

    await this.shipmentRepository.save(shipment);
    await this.syncOrderStatusFromGoship(shipment.orderId, statusText);
  }

  private async syncOrderStatusFromGoship(
    orderId: string,
    goshipStatusText: string,
  ) {
    const nextOrderStatus = this.mapGoshipStatusToOrderStatus(goshipStatusText);
    if (!nextOrderStatus) return;

    const order = await this.orderRepository.findOne({
      where: { id: orderId },
      select: { id: true, userId: true, status: true },
    });

    if (
      !order ||
      order.status === 'CANCELLED' ||
      order.status === 'DELIVERED'
    ) {
      return;
    }

    if (nextOrderStatus === 'SHIPPING' && order.status !== 'CONFIRMED') {
      return;
    }

    if (
      nextOrderStatus === 'DELIVERED' &&
      order.status !== 'CONFIRMED' &&
      order.status !== 'SHIPPING'
    ) {
      return;
    }

    await this.orderRepository.update(orderId, { status: nextOrderStatus });

    if (nextOrderStatus === 'DELIVERED') {
      await this.vipService.syncUserVipProgress(order.userId);
    }
  }

  private mapGoshipStatusToOrderStatus(
    statusText: string,
  ): 'SHIPPING' | 'DELIVERED' | null {
    const normalizedStatus = statusText
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');

    if (
      normalizedStatus.includes('delivered') ||
      normalizedStatus.includes('completed') ||
      normalizedStatus.includes('thanh cong') ||
      normalizedStatus.includes('da giao') ||
      normalizedStatus.includes('giao hang thanh cong')
    ) {
      return 'DELIVERED';
    }

    if (!normalizedStatus) {
      return null;
    }

    return 'SHIPPING';
  }

  private async validateDestinationCodes(
    cityId: string,
    districtId: string,
    wardId: string,
  ): Promise<void> {
    const cityCode = String(cityId);
    const districtCode = String(districtId);
    const wardCode = String(wardId);

    const provinces = await this.getProvinces();
    const city = provinces.find((province) => province.id === cityCode);
    if (!city) {
      throw new BadRequestException('Invalid Goship city/province id');
    }

    const districts = await this.getDistricts(cityCode);
    const district = districts.find((item) => item.id === districtCode);
    if (!district) {
      throw new BadRequestException(
        'Invalid Goship district id for the selected city/province',
      );
    }

    const wards = await this.getWards(districtCode);
    const ward = wards.find((item) => item.id === wardCode);
    if (!ward) {
      throw new BadRequestException(
        'Invalid Goship ward id for the selected district',
      );
    }
  }

  private async resolveAddressCodes(
    provinceValue: string,
    districtValue: string,
    wardValue: string,
  ): Promise<{ city: string; district: string; ward: string }> {
    const provinces = await this.getProvinces();
    const city = this.findByIdOrName(provinces, provinceValue);
    if (!city) {
      throw new BadRequestException(
        `Cannot resolve Goship city/province from address value: ${provinceValue}`,
      );
    }

    const districts = await this.getDistricts(city.id);
    const district = this.findByIdOrName(districts, districtValue);
    if (!district) {
      throw new BadRequestException(
        `Cannot resolve Goship district from address value: ${districtValue}`,
      );
    }

    const wards = await this.getWards(district.id);
    const ward = this.findByIdOrName(wards, wardValue);
    if (!ward) {
      throw new BadRequestException(
        `Cannot resolve Goship ward from address value: ${wardValue}`,
      );
    }

    return {
      city: city.id,
      district: district.id,
      ward: ward.id,
    };
  }

  private findByIdOrName<T extends { id: string; name: string }>(
    items: T[],
    value: string,
  ): T | undefined {
    const normalizedValue = this.normalizeAddressText(value);

    return items.find(
      (item) =>
        item.id === String(value) ||
        this.normalizeAddressText(item.name) === normalizedValue,
    );
  }

  private normalizeAddressText(value: string): string {
    const normalized = String(value)
      .trim()
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^\w\s]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    return normalized
      .replace(/^(tp|t p|thanh pho|tinh)\s+/, '')
      .replace(/^(quan|huyen|thi xa|thi tran|phuong|xa)\s+/, '')
      .replace(/\s+/g, ' ')
      .trim();
  }

  private getSenderAddress() {
    return {
      name: this.getRequiredConfig('GOSHIP_SENDER_NAME'),
      phone: this.getRequiredConfig('GOSHIP_SENDER_PHONE'),
      street: this.getRequiredConfig('GOSHIP_SENDER_STREET'),
      ward: this.getSenderWard(),
      district: this.getSenderDistrict(),
      city: this.getSenderCity(),
    };
  }

  private getSenderCity(): string {
    return this.getRequiredConfig('GOSHIP_SENDER_CITY');
  }

  private getSenderDistrict(): string {
    return this.getRequiredConfig('GOSHIP_SENDER_DISTRICT');
  }

  private getSenderWard(): string {
    return this.getRequiredConfig('GOSHIP_SENDER_WARD');
  }

  private getRequiredConfig(key: string): string {
    const value = this.configService.get<string>(key);
    if (!value?.trim()) {
      throw new BadRequestException(`Missing ${key} configuration`);
    }
    return value.trim();
  }

  private getBaseUrl(): string {
    return (
      this.configService.get<string>('GOSHIP_API_URL') ??
      'https://api.goship.io/api/v2'
    ).replace(/\/$/, '');
  }

  private getAccessToken(): string {
    const token = this.configService.get<string>('GOSHIP_ACCESS_TOKEN');
    if (!token) {
      throw new BadRequestException(
        'Missing GOSHIP_ACCESS_TOKEN configuration',
      );
    }
    return token;
  }

  private async postToGoship(
    pathname: string,
    payload: unknown,
  ): Promise<unknown> {
    try {
      const response = await firstValueFrom(
        this.httpService.post(`${this.getBaseUrl()}${pathname}`, payload, {
          headers: {
            Authorization: `Bearer ${this.getAccessToken()}`,
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
        }),
      );

      return response.data as unknown;
    } catch (error) {
      this.handleAxiosError(error, `Goship request failed: ${pathname}`);
    }
  }

  private async getFromGoship(pathname: string): Promise<unknown> {
    try {
      const response = await firstValueFrom(
        this.httpService.get(`${this.getBaseUrl()}${pathname}`, {
          headers: {
            Authorization: `Bearer ${this.getAccessToken()}`,
            Accept: 'application/json',
          },
        }),
      );

      return response.data as unknown;
    } catch (error) {
      this.handleAxiosError(error, `Goship request failed: ${pathname}`);
    }
  }

  private extractGoshipData<T>(response: unknown, fallback: T): T {
    if (!this.isRecord(response)) {
      return fallback;
    }

    const code = response.code;
    if (code !== undefined && code !== 200) {
      throw new BadRequestException(
        this.normalizeString(response.message) ||
          'Goship returned an unsuccessful response',
      );
    }

    return (response.data ?? response) as T;
  }

  private extractGoshipShipmentData(response: unknown): GoshipObject {
    if (!this.isRecord(response)) {
      throw new BadRequestException('Goship shipment response is invalid');
    }

    const code = response.code;
    if (code !== undefined && code !== 200) {
      throw new BadRequestException(
        this.normalizeString(response.message) ||
          'Goship returned an unsuccessful shipment response',
      );
    }

    const data = response.data ?? response;
    if (this.isRecord(data)) {
      return data;
    }

    if (Array.isArray(data) && data.length > 0 && this.isRecord(data[0])) {
      return data[0];
    }

    throw new BadRequestException(
      'Goship did not return shipment data. Please verify the selected rateId and shipment payload.',
    );
  }

  private normalizeString(value: unknown): string {
    if (typeof value === 'string') return value;
    if (typeof value === 'number' || typeof value === 'boolean') {
      return String(value);
    }
    return '';
  }

  private isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null;
  }

  private handleAxiosError(error: unknown, contextMessage: string): never {
    if (isAxiosError(error) && error.response) {
      const responseBody =
        typeof error.response.data === 'string'
          ? error.response.data
          : JSON.stringify(error.response.data);

      throw new BadRequestException(
        `${contextMessage} (${error.response.status}): ${responseBody}`,
      );
    }

    const message = error instanceof Error ? error.message : 'Unknown error';
    throw new BadRequestException(`${contextMessage}: ${message}`);
  }
}
