import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/enums/role.enum';
import { RolesGuard } from '../../common/guards/roles.guard';
import { VehicleBrandsService } from './vehicle-brands.service';

@Controller('vehicle-brands')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class VehicleBrandsController {
  constructor(private readonly vehicleBrandsService: VehicleBrandsService) {}

  @Get()
  findAll() {
    return this.vehicleBrandsService.findAll();
  }

  @Post()
  @Roles(Role.ADMIN)
  create(@Body() body: { name: string }) {
    return this.vehicleBrandsService.create(body);
  }

  @Patch(':id')
  @Roles(Role.ADMIN)
  update(@Param('id', ParseIntPipe) id: number, @Body() body: { name?: string }) {
    return this.vehicleBrandsService.update(id, body);
  }

  @Delete(':id')
  @Roles(Role.ADMIN)
  async remove(@Param('id', ParseIntPipe) id: number) {
    await this.vehicleBrandsService.remove(id);
    return { success: true };
  }
}
