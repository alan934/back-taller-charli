import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Query,
  UseGuards,
  Post,
  Put,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/enums/role.enum';
import { RolesGuard } from '../../common/guards/roles.guard';
import { UsersService } from './users.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { CreateClientDto } from './dto/create-client.dto';
import { randomUUID } from 'crypto';
import { UpsertVehicleDto } from './dto/upsert-vehicle.dto';
import { UpsertPartDto } from './dto/upsert-part.dto';

@Controller('users')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('clients')
  @Roles(Role.ADMIN)
  async listClients(@Query('q') q = '') {
    const users = await this.usersService.findClients(q);
    return users.map((u) => this.usersService.sanitizeUser(u));
  }

  @Post('clients')
  @Roles(Role.ADMIN)
  async createClient(@Body() dto: CreateClientDto) {
    const created = await this.usersService.create({
      email: dto.email,
      password: dto.password || randomUUID(),
      fullName: dto.fullName,
      phone: dto.phone,
      role: Role.CLIENT,
    });

    return this.usersService.sanitizeUser(created);
  }

  @Patch(':id')
  @Roles(Role.ADMIN)
  async updateClient(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateUserDto,
  ) {
    const updated = await this.usersService.updateClient(id, dto);
    return this.usersService.sanitizeUser(updated);
  }

  @Delete(':id')
  @Roles(Role.ADMIN)
  async deleteClient(@Param('id', ParseIntPipe) id: number) {
    await this.usersService.softDeleteClient(id);
    return { success: true };
  }

  @Get(':id/vehicles')
  @Roles(Role.ADMIN)
  async listVehicles(@Param('id', ParseIntPipe) id: number) {
    return this.usersService.listVehicles(id);
  }

  @Post(':id/vehicles')
  @Roles(Role.ADMIN)
  async addVehicle(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpsertVehicleDto,
  ) {
    return this.usersService.createVehicle(id, dto);
  }

  @Put(':id/vehicles/:vehicleId')
  @Roles(Role.ADMIN)
  async updateVehicle(
    @Param('id', ParseIntPipe) id: number,
    @Param('vehicleId', ParseIntPipe) vehicleId: number,
    @Body() dto: UpsertVehicleDto,
  ) {
    return this.usersService.updateVehicle(id, vehicleId, dto);
  }

  @Delete(':id/vehicles/:vehicleId')
  @Roles(Role.ADMIN)
  async deleteVehicle(
    @Param('id', ParseIntPipe) id: number,
    @Param('vehicleId', ParseIntPipe) vehicleId: number,
  ) {
    return this.usersService.deleteVehicle(id, vehicleId);
  }

  @Get(':id/parts')
  @Roles(Role.ADMIN)
  async listParts(@Param('id', ParseIntPipe) id: number) {
    return this.usersService.listParts(id);
  }

  @Post(':id/parts')
  @Roles(Role.ADMIN)
  async addPart(@Param('id', ParseIntPipe) id: number, @Body() dto: UpsertPartDto) {
    return this.usersService.createPart(id, dto);
  }

  @Put(':id/parts/:partId')
  @Roles(Role.ADMIN)
  async updatePart(
    @Param('id', ParseIntPipe) id: number,
    @Param('partId', ParseIntPipe) partId: number,
    @Body() dto: UpsertPartDto,
  ) {
    return this.usersService.updatePart(id, partId, dto);
  }

  @Delete(':id/parts/:partId')
  @Roles(Role.ADMIN)
  async deletePart(
    @Param('id', ParseIntPipe) id: number,
    @Param('partId', ParseIntPipe) partId: number,
  ) {
    return this.usersService.deletePart(id, partId);
  }
}
