import { Body, Controller, Get, Put, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/enums/role.enum';
import { RolesGuard } from '../../common/guards/roles.guard';
import { AvailabilityQueryDto } from './dto/availability.dto';
import { UpsertWorkdaysDto } from './dto/workday.dto';
import { AgendaService } from './agenda.service';

@Controller('agenda')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class AgendaController {
  constructor(private readonly agendaService: AgendaService) {}

  @Get('slots')
  async getSlots(@Query() query: AvailabilityQueryDto) {
    return this.agendaService.getSlots(query);
  }

  @Get('workdays')
  @Roles(Role.ADMIN)
  async listWorkdays() {
    return this.agendaService.listWorkdays();
  }

  @Put('workdays')
  @Roles(Role.ADMIN)
  async upsertWorkdays(@Body() dto: UpsertWorkdaysDto) {
    return this.agendaService.upsertWorkdays(dto);
  }
}
