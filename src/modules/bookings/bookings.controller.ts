import {
  Body,
  Controller,
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

  @Patch(':id/status')
  @Roles(Role.ADMIN)
  async updateStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateStatusDto,
  ) {
    return this.bookingsService.updateStatus(id, dto.status);
  }
}
