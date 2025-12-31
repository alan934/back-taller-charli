import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { VehicleTypeEntity } from './entities/vehicle-type.entity';

@Injectable()
export class VehicleTypesService {
  constructor(
    @InjectRepository(VehicleTypeEntity)
    private readonly vehicleTypesRepo: Repository<VehicleTypeEntity>,
  ) {}

  findAll() {
    return this.vehicleTypesRepo.find({ order: { name: 'ASC' } });
  }

  async create(data: { code: string; name: string; description?: string }) {
    const exists = await this.vehicleTypesRepo.exists({ where: { code: data.code } });
    if (exists) {
      throw new ConflictException('El código de tipo ya existe');
    }
    const entity = this.vehicleTypesRepo.create(data);
    return this.vehicleTypesRepo.save(entity);
  }

  async update(id: number, data: Partial<VehicleTypeEntity>) {
    const found = await this.vehicleTypesRepo.findOne({ where: { id } });
    if (!found) throw new NotFoundException('Tipo no encontrado');
    Object.assign(found, data);
    return this.vehicleTypesRepo.save(found);
  }

  async remove(id: number) {
    const result = await this.vehicleTypesRepo.delete(id);
    if (!result.affected) throw new NotFoundException('Tipo no encontrado');
  }
}
