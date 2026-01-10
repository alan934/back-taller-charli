import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/enums/role.enum';
import { RolesGuard } from '../../common/guards/roles.guard';
import { CreateIssueDto } from './dto/create-issue.dto';
import { UpdateIssueDto } from './dto/update-issue.dto';
import { ListIssuesQueryDto } from './dto/list-issues-query.dto';
import { IssuesService } from './issues.service';

@Controller('issues')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class IssuesController {
  constructor(private readonly issuesService: IssuesService) {}

  @Get('common')
  async listCommon(@Query() query: ListIssuesQueryDto) {
    return this.issuesService.listCommon(query.partCategoryId);
  }

  @Post()
  @Roles(Role.ADMIN)
  async create(@Body() dto: CreateIssueDto) {
    return this.issuesService.create(dto);
  }

  @Patch(':id')
  @Roles(Role.ADMIN)
  async update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateIssueDto) {
    return this.issuesService.update(id, dto);
  }

  @Delete(':id')
  @Roles(Role.ADMIN)
  async delete(@Param('id', ParseIntPipe) id: number) {
    return this.issuesService.delete(id);
  }
}
