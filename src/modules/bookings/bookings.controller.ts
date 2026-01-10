import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Patch,
  Query,
  Req,
  UseGuards,
  ForbiddenException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/enums/role.enum';
import { RolesGuard } from '../../common/guards/roles.guard';
import { CreateBookingDto } from './dto/create-booking.dto';
import { BookingsService } from './bookings.service';
import { UpdateStatusDto } from './dto/update-status.dto';
import { CreateUsedPartDto } from './dto/create-used-part.dto';
import { UpdateDetailsDto } from './dto/update-details.dto';
import { UpdateRepairNotesDto } from './dto/update-repair-notes.dto';

@Controller('bookings')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class BookingsController {
  constructor(private readonly bookingsService: BookingsService) {}

  @Post()
  async create(@Body() dto: CreateBookingDto, @Req() req: any) {
    const requesterId = req.user?.id;
    return this.bookingsService.create(dto, requesterId);
  }

  @Get('customers/search')
  @Roles(Role.ADMIN)
  async searchCustomers(@Query('q') q = '') {
    return this.bookingsService.searchCustomers(q);
  }

  @Get('customers/:id/vehicles')
  @Roles(Role.ADMIN)
  async listCustomerVehicles(@Param('id', ParseIntPipe) id: number) {
    return this.bookingsService.listCustomerVehicles(id);
  }

  @Get()
  @Roles(Role.ADMIN)
  async findAll() {
    return this.bookingsService.findAll();
  }

  @Get('me')
  async findMine(@Req() req: any) {
    return this.bookingsService.findByCustomer(req.user.id);
  }

  @Get('summary')
  async summary(@Req() req: any) {
    return this.bookingsService.summaryFor(req.user);
  }

  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number, @Req() req: any) {
    const booking = await this.bookingsService.findOne(id);
    if (req.user.role !== Role.ADMIN && booking.customer?.id !== req.user.id) {
      throw new ForbiddenException('No tienes permisos para ver este turno');
    }
    return booking;
  }

  @Get('vehicle/:id')
  async findByVehicle(@Param('id', ParseIntPipe) id: number, @Req() req: any) {
    // TODO: Verify ownership if not admin
    return this.bookingsService.findByVehicle(id);
  }

  @Get('part/:id')
  async findByPart(@Param('id', ParseIntPipe) id: number) {
    // TODO: Verify ownership if not admin
    return this.bookingsService.findByPart(id);
  }

  @Patch(':id/status')
  @Roles(Role.ADMIN)
  async updateStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateStatusDto,
  ) {
    return this.bookingsService.updateStatus(id, dto.status);
  }

  @Post(':id/parts')
  @Roles(Role.ADMIN)
  async addUsedPart(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: CreateUsedPartDto,
  ) {
    return this.bookingsService.addUsedPart(id, dto);
  }

  @Delete(':id/parts/:partId')
  @Roles(Role.ADMIN)
  async removeUsedPart(
    @Param('id', ParseIntPipe) id: number,
    @Param('partId', ParseIntPipe) partId: number,
  ) {
    return this.bookingsService.removeUsedPart(id, partId);
  }

  @Patch(':id/details')
  @Roles(Role.ADMIN)
  async updateDetails(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateDetailsDto,
  ) {
    return this.bookingsService.updateDetails(id, dto.details || '');
  }

  @Patch(':id/repair-notes')
  @Roles(Role.ADMIN)
  async updateRepairNotes(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateRepairNotesDto,
  ) {
    return this.bookingsService.updateRepairNotes(id, dto.repairNotes || '');
  }
}
