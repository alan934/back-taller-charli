import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { instanceToPlain } from 'class-transformer';
import * as bcrypt from 'bcryptjs';
import { Repository, ILike } from 'typeorm';
import { Role } from '../../common/enums/role.enum';
import { User } from './entities/user.entity';
import { Vehicle } from '../bookings/entities/vehicle.entity';
import { VehicleTypeEntity } from '../bookings/entities/vehicle-type.entity';
import { VehicleBrand } from '../bookings/entities/vehicle-brand.entity';
import { Part } from '../bookings/entities/part.entity';
import { PartCategory } from '../bookings/entities/part-category.entity';
import { UpsertVehicleDto } from './dto/upsert-vehicle.dto';
import { UpsertPartDto } from './dto/upsert-part.dto';

interface CreateUserInput {
  email: string;
  password: string;
  fullName?: string;
  phone?: string;
  role?: Role;
}

interface UpdateUserInput {
  email?: string;
  fullName?: string | null;
  phone?: string | null;
}

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User) private readonly usersRepo: Repository<User>,
    @InjectRepository(Vehicle) private readonly vehiclesRepo: Repository<Vehicle>,
    @InjectRepository(VehicleTypeEntity) private readonly vehicleTypesRepo: Repository<VehicleTypeEntity>,
    @InjectRepository(VehicleBrand) private readonly vehicleBrandsRepo: Repository<VehicleBrand>,
    @InjectRepository(Part) private readonly partsRepo: Repository<Part>,
    @InjectRepository(PartCategory) private readonly partCategoriesRepo: Repository<PartCategory>,
  ) {}

  private async getClientOrThrow(id: number): Promise<User> {
    const user = await this.usersRepo.findOne({ where: { id, role: Role.CLIENT, isActive: true } });
    if (!user) {
      throw new NotFoundException('Cliente no encontrado');
    }
    return user;
  }

  async create(input: CreateUserInput): Promise<User> {
    const exists = await this.usersRepo.findOne({ where: { email: input.email.toLowerCase() }, withDeleted: true });
    if (exists) {
      throw new ConflictException('Email already registered');
    }

    const user = this.usersRepo.create({
      email: input.email.toLowerCase(),
      fullName: input.fullName,
      phone: input.phone,
      password: await bcrypt.hash(input.password, 12),
      role: input.role ?? Role.CLIENT,
    });

    return this.usersRepo.save(user);
  }

  async findByEmail(email: string, includePassword = false): Promise<User | null> {
    if (includePassword) {
      return this.usersRepo.findOne({
        where: { email: email.toLowerCase(), isActive: true },
        select: ['id', 'email', 'fullName', 'phone', 'password', 'role', 'createdAt', 'updatedAt'],
      });
    }

    return this.usersRepo.findOne({ where: { email: email.toLowerCase(), isActive: true } });
  }

  async findById(id: number): Promise<User | null> {
    return this.usersRepo.findOne({ where: { id, isActive: true } });
  }

  async searchClients(query: string, limit = 10): Promise<User[]> {
    const q = query.trim();
    if (!q) return [];
    return this.usersRepo.find({
      where: [
        { email: ILike(`%${q}%`), role: Role.CLIENT },
        { fullName: ILike(`%${q}%`), role: Role.CLIENT },
      ],
      take: limit,
      order: { createdAt: 'DESC' },
    });
  }

  async findClients(query = ''): Promise<User[]> {
    const q = query.trim();
    if (!q) {
      return this.usersRepo.find({ where: { role: Role.CLIENT, isActive: true } });
    }

    return this.usersRepo.find({
      where: [
        { email: ILike(`%${q}%`), role: Role.CLIENT, isActive: true },
        { fullName: ILike(`%${q}%`), role: Role.CLIENT, isActive: true },
      ],
      order: { createdAt: 'DESC' },
    });
  }

  async updateClient(id: number, input: UpdateUserInput): Promise<User> {
    const user = await this.getClientOrThrow(id);

    if (input.email && input.email.toLowerCase() !== user.email) {
      const exists = await this.usersRepo.findOne({
        where: { email: input.email.toLowerCase() },
        withDeleted: true,
      });
      if (exists) {
        throw new ConflictException('Email already registered');
      }
    }

    user.email = input.email?.toLowerCase() ?? user.email;
    user.fullName = input.fullName ?? user.fullName;
    user.phone = input.phone ?? user.phone;

    return this.usersRepo.save(user);
  }

  async softDeleteClient(id: number): Promise<void> {
    const user = await this.getClientOrThrow(id);

    user.isActive = false;
    await this.usersRepo.save(user);
    await this.usersRepo.softRemove(user);
  }

  sanitizeUser(user: User): Record<string, unknown> {
    return instanceToPlain(user);
  }

  async listVehicles(clientId: number) {
    await this.getClientOrThrow(clientId);
    const vehicles = await this.vehiclesRepo.find({ where: { owner: { id: clientId } } });
    return vehicles.map((v) => instanceToPlain(v));
  }

  async createVehicle(clientId: number, dto: UpsertVehicleDto) {
    const owner = await this.getClientOrThrow(clientId);

    const type = await this.vehicleTypesRepo.findOne({ where: { id: dto.typeId } });
    if (!type) throw new NotFoundException('Tipo de vehículo inexistente');

    let brand = null;
    if (dto.brandId) {
      brand = await this.vehicleBrandsRepo.findOne({ where: { id: dto.brandId } });
      if (!brand) throw new NotFoundException('Marca de vehículo inexistente');
    }

    const vehicle = this.vehiclesRepo.create({
      owner: { id: owner.id } as User,
      type,
      brand,
      brandOther: dto.brandOther ?? null,
      model: dto.model,
      year: dto.year ?? undefined,
      vinOrPlate: dto.vinOrPlate ?? undefined,
      notes: dto.notes ?? undefined,
    });

    const saved = await this.vehiclesRepo.save(vehicle);
    return instanceToPlain(saved);
  }

  async updateVehicle(clientId: number, vehicleId: number, dto: UpsertVehicleDto) {
    await this.getClientOrThrow(clientId);
    const vehicle = await this.vehiclesRepo.findOne({ where: { id: vehicleId }, relations: ['owner'] });
    if (!vehicle || vehicle.owner.id !== clientId) {
      throw new NotFoundException('Vehículo no encontrado');
    }

    const type = await this.vehicleTypesRepo.findOne({ where: { id: dto.typeId } });
    if (!type) throw new NotFoundException('Tipo de vehículo inexistente');

    let brand = null;
    if (dto.brandId) {
      brand = await this.vehicleBrandsRepo.findOne({ where: { id: dto.brandId } });
      if (!brand) throw new NotFoundException('Marca de vehículo inexistente');
    }

    vehicle.type = type;
    vehicle.brand = brand;
    vehicle.brandOther = dto.brandOther ?? null;
    vehicle.model = dto.model;
    vehicle.year = dto.year ?? undefined;
    vehicle.vinOrPlate = dto.vinOrPlate ?? undefined;
    vehicle.notes = dto.notes ?? undefined;

    const saved = await this.vehiclesRepo.save(vehicle);
    return instanceToPlain(saved);
  }

  async deleteVehicle(clientId: number, vehicleId: number) {
    await this.getClientOrThrow(clientId);
    const vehicle = await this.vehiclesRepo.findOne({ where: { id: vehicleId }, relations: ['owner'] });
    if (!vehicle || vehicle.owner.id !== clientId) {
      throw new NotFoundException('Vehículo no encontrado');
    }

    await this.vehiclesRepo.remove(vehicle);
    return { success: true };
  }

  async listParts(clientId: number) {
    await this.getClientOrThrow(clientId);
    const parts = await this.partsRepo.find({ where: { owner: { id: clientId } } });
    return parts.map((p) => instanceToPlain(p));
  }

  async createPart(clientId: number, dto: UpsertPartDto) {
    const owner = await this.getClientOrThrow(clientId);

    const category = await this.partCategoriesRepo.findOne({ where: { id: dto.categoryId } });
    if (!category) throw new NotFoundException('Categoría de pieza inexistente');

    const part = this.partsRepo.create({
      owner: { id: owner.id } as User,
      category,
      description: dto.description,
    });

    const saved = await this.partsRepo.save(part);
    return instanceToPlain(saved);
  }

  async updatePart(clientId: number, partId: number, dto: UpsertPartDto) {
    await this.getClientOrThrow(clientId);
    const part = await this.partsRepo.findOne({ where: { id: partId }, relations: ['owner'] });
    if (!part || part.owner.id !== clientId) {
      throw new NotFoundException('Pieza no encontrada');
    }

    const category = await this.partCategoriesRepo.findOne({ where: { id: dto.categoryId } });
    if (!category) throw new NotFoundException('Categoría de pieza inexistente');

    part.category = category;
    part.description = dto.description;

    const saved = await this.partsRepo.save(part);
    return instanceToPlain(saved);
  }

  async deletePart(clientId: number, partId: number) {
    await this.getClientOrThrow(clientId);
    const part = await this.partsRepo.findOne({ where: { id: partId }, relations: ['owner'] });
    if (!part || part.owner.id !== clientId) {
      throw new NotFoundException('Pieza no encontrada');
    }

    await this.partsRepo.remove(part);
    return { success: true };
  }
}
