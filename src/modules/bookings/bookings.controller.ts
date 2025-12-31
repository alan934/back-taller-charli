import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
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

@Controller('bookings')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class BookingsController {
  constructor(private readonly bookingsService: BookingsService) {}

  @Post()
  async create(@Body() dto: CreateBookingDto, @Req() req: any) {
    const requesterId = req.user?.id;
    return this.bookingsService.create(dto, requesterId);
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
}
