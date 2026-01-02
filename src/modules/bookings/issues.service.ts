import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import { CreateIssueDto } from './dto/create-issue.dto';
import { UpdateIssueDto } from './dto/update-issue.dto';
import { IssueKind } from './enums/issue-kind.enum';
import { Issue } from './entities/issue.entity';
import { PartCategory } from './entities/part-category.entity';

@Injectable()
export class IssuesService {
  constructor(
    @InjectRepository(Issue) private readonly issuesRepo: Repository<Issue>,
    @InjectRepository(PartCategory)
    private readonly partCategoriesRepo: Repository<PartCategory>,
  ) {}

  async listCommon(partCategoryId?: number) {
    if (partCategoryId) {
      return this.issuesRepo.find({
        where: { kind: IssueKind.COMMON, partCategory: { id: partCategoryId } },
      });
    }

    // Default: todas las fallas comunes (incluye las ligadas a categorías)
    return this.issuesRepo.find({ where: { kind: IssueKind.COMMON } });
  }

  async create(dto: CreateIssueDto) {
    const exists = await this.issuesRepo.exists({ where: { label: dto.label } });
    if (exists) {
      throw new ConflictException('La falla ya existe');
    }

    let partCategory: PartCategory | null = null;
    if (dto.partCategoryId) {
      partCategory = await this.partCategoriesRepo.findOne({ where: { id: dto.partCategoryId } });
      if (!partCategory) {
        throw new NotFoundException('Categoría de pieza no encontrada');
      }
    }

    const issue = this.issuesRepo.create({ ...dto, partCategory });
    return this.issuesRepo.save(issue);
  }

  async update(id: number, dto: UpdateIssueDto) {
    const issue = await this.issuesRepo.findOne({ where: { id } });
    if (!issue) {
      throw new NotFoundException('Falla no encontrada');
    }

    if (dto.label && dto.label !== issue.label) {
      const exists = await this.issuesRepo.exists({ where: { label: dto.label } });
      if (exists) {
        throw new ConflictException('La falla ya existe');
      }
    }

    let partCategory: PartCategory | null | undefined;
    if (dto.partCategoryId !== undefined) {
      partCategory = await this.partCategoriesRepo.findOne({ where: { id: dto.partCategoryId } });
      if (!partCategory) {
        throw new NotFoundException('Categoría de pieza no encontrada');
      }
    }

    Object.assign(issue, dto);
    if (dto.partCategoryId !== undefined) {
      issue.partCategory = partCategory ?? null;
    }

    return this.issuesRepo.save(issue);
  }
}
