import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/enums/role.enum';
import { RolesGuard } from '../../common/guards/roles.guard';
import { VehicleTypesService } from './vehicle-types.service';

@Controller('vehicle-types')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class VehicleTypesController {
  constructor(private readonly vehicleTypesService: VehicleTypesService) {}

  @Get()
  findAll() {
    return this.vehicleTypesService.findAll();
  }

  @Post()
  @Roles(Role.ADMIN)
  create(@Body() body: { code: string; name: string; description?: string }) {
    return this.vehicleTypesService.create(body);
  }

  @Patch(':id')
  @Roles(Role.ADMIN)
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: { code?: string; name?: string; description?: string },
  ) {
    return this.vehicleTypesService.update(id, body);
  }

  @Delete(':id')
  @Roles(Role.ADMIN)
  async remove(@Param('id', ParseIntPipe) id: number) {
    await this.vehicleTypesService.remove(id);
    return { success: true };
  }
}
