import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { VehicleBrand } from './entities/vehicle-brand.entity';

@Injectable()
export class VehicleBrandsService {
  constructor(
    @InjectRepository(VehicleBrand)
    private readonly vehicleBrandsRepo: Repository<VehicleBrand>,
  ) {}

  findAll() {
    return this.vehicleBrandsRepo.find({ order: { name: 'ASC' } });
  }

  async create(data: { name: string }) {
    const exists = await this.vehicleBrandsRepo.exists({ where: { name: data.name } });
    if (exists) {
      throw new ConflictException('La marca ya existe');
    }
    const entity = this.vehicleBrandsRepo.create(data);
    return this.vehicleBrandsRepo.save(entity);
  }

  async update(id: number, data: Partial<VehicleBrand>) {
    const found = await this.vehicleBrandsRepo.findOne({ where: { id } });
    if (!found) throw new NotFoundException('Marca no encontrada');
    Object.assign(found, data);
    return this.vehicleBrandsRepo.save(found);
  }

  async remove(id: number) {
    const result = await this.vehicleBrandsRepo.delete(id);
    if (!result.affected) throw new NotFoundException('Marca no encontrada');
  }
}
