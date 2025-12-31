import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/enums/role.enum';
import { RolesGuard } from '../../common/guards/roles.guard';
import { CreatePartCategoryDto } from './dto/create-part-category.dto';
import { UpdatePartCategoryDto } from './dto/update-part-category.dto';
import { PartCategoriesService } from './part-categories.service';

@Controller('part-categories')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class PartCategoriesController {
  constructor(private readonly partCategoriesService: PartCategoriesService) {}

  @Get()
  async findAll() {
    return this.partCategoriesService.findAll();
  }

  @Post()
  @Roles(Role.ADMIN)
  async create(@Body() dto: CreatePartCategoryDto) {
    return this.partCategoriesService.create(dto);
  }

  @Patch(':id')
  @Roles(Role.ADMIN)
  async update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdatePartCategoryDto) {
    return this.partCategoriesService.update(id, dto);
  }

  @Delete(':id')
  @Roles(Role.ADMIN)
  async remove(@Param('id', ParseIntPipe) id: number) {
    await this.partCategoriesService.remove(id);
    return { success: true };
  }
}
