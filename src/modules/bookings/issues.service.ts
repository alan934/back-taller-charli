import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import { CreateIssueDto } from './dto/create-issue.dto';
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

    // Default: only issues that apply to vehicles (no part category linked)
    return this.issuesRepo.find({ where: { kind: IssueKind.COMMON, partCategory: IsNull() } });
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
}
