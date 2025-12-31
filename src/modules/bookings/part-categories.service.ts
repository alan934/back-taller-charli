import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreatePartCategoryDto } from './dto/create-part-category.dto';
import { UpdatePartCategoryDto } from './dto/update-part-category.dto';
import { PartCategory } from './entities/part-category.entity';

@Injectable()
export class PartCategoriesService {
  constructor(
    @InjectRepository(PartCategory)
    private readonly partCategoriesRepo: Repository<PartCategory>,
  ) {}

  async findAll() {
    return this.partCategoriesRepo.find({ order: { name: 'ASC' } });
  }

  async create(dto: CreatePartCategoryDto) {
    const exists = await this.partCategoriesRepo.exists({ where: { code: dto.code } });
    if (exists) {
      throw new ConflictException('La categoría ya existe');
    }
    const category = this.partCategoriesRepo.create(dto);
    return this.partCategoriesRepo.save(category);
  }

  async update(id: number, dto: UpdatePartCategoryDto) {
    const category = await this.partCategoriesRepo.findOne({ where: { id } });
    if (!category) {
      throw new NotFoundException('Categoría no encontrada');
    }
    if (dto.code && dto.code !== category.code) {
      const conflict = await this.partCategoriesRepo.exists({ where: { code: dto.code } });
      if (conflict) {
        throw new ConflictException('La categoría ya existe');
      }
    }
    Object.assign(category, dto);
    return this.partCategoriesRepo.save(category);
  }

  async remove(id: number) {
    const category = await this.partCategoriesRepo.findOne({
      where: { id },
      relations: ['parts', 'issues'],
    });
    if (!category) {
      throw new NotFoundException('Categoría no encontrada');
    }
    if ((category.parts?.length ?? 0) > 0 || (category.issues?.length ?? 0) > 0) {
      throw new BadRequestException('No se puede eliminar una categoría en uso');
    }
    await this.partCategoriesRepo.remove(category);
  }
}
