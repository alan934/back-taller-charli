import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { randomUUID } from 'crypto';
import { In, MoreThan, Repository } from 'typeorm';
import { UsersService } from '../users/users.service';
import { Role } from '../../common/enums/role.enum';
import { AssetType } from './enums/asset-type.enum';
import { BookingStatus } from './enums/booking-status.enum';
import { BookingTimeType } from './enums/booking-time-type.enum';
import { CreateBookingDto } from './dto/create-booking.dto';
import { Booking } from './entities/booking.entity';
import { BookingUsedPart } from './entities/booking-used-part.entity';
import { Issue } from './entities/issue.entity';
import { Part } from './entities/part.entity';
import { PartCategory } from './entities/part-category.entity';
import { Vehicle } from './entities/vehicle.entity';
import { VehicleBrand } from './entities/vehicle-brand.entity';
import { VehicleTypeEntity } from './entities/vehicle-type.entity';
import { Workday } from './entities/workday.entity';
import { HolidayBlock } from './entities/holiday-block.entity';
import { WorkdayOverride } from './entities/workday-override.entity';
import { User } from '../users/entities/user.entity';
import { betweenDates } from './helpers/typeorm-between.util';
import { overlapsRange } from './helpers/booking-overlap.util';
import { MailService } from './mail.service';
import { CreateUsedPartDto } from './dto/create-used-part.dto';
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationType } from '../notifications/entities/notification.entity';

@Injectable()
export class BookingsService {
  private readonly timeZone = 'America/Argentina/Buenos_Aires';
  private readonly offsetMinutes = -180; // Argentina UTC-3 fixed

  constructor(
    @InjectRepository(Booking) private readonly bookingsRepo: Repository<Booking>,
    @InjectRepository(BookingUsedPart) private readonly usedPartsRepo: Repository<BookingUsedPart>,
    @InjectRepository(Issue) private readonly issuesRepo: Repository<Issue>,
    @InjectRepository(Vehicle) private readonly vehiclesRepo: Repository<Vehicle>,
    @InjectRepository(Part) private readonly partsRepo: Repository<Part>,
    @InjectRepository(PartCategory) private readonly partCategoriesRepo: Repository<PartCategory>,
    @InjectRepository(VehicleBrand) private readonly vehicleBrandsRepo: Repository<VehicleBrand>,
    @InjectRepository(VehicleTypeEntity)
    private readonly vehicleTypesRepo: Repository<VehicleTypeEntity>,
    @InjectRepository(Workday) private readonly workdaysRepo: Repository<Workday>,
    @InjectRepository(HolidayBlock) private readonly blocksRepo: Repository<HolidayBlock>,
    @InjectRepository(WorkdayOverride)
    private readonly overridesRepo: Repository<WorkdayOverride>,
    private readonly usersService: UsersService,
    private readonly mailService: MailService,
    private readonly notificationsService: NotificationsService,
  ) {}

  // Compute timezone offset in minutes for a given local date/time (BA)
  private localToUtc(year: number, monthIndex: number, day: number, hour: number, minute: number, second: number = 0) {
    const utcMs = Date.UTC(year, monthIndex, day, hour, minute, second) - this.offsetMinutes * 60000;
    return new Date(utcMs);
  }

  private getLocalDateParts(date: Date) {
    const local = new Date(date.getTime() + this.offsetMinutes * 60000);
    const y = local.getUTCFullYear();
    const m = local.getUTCMonth() + 1;
    const d = local.getUTCDate();
    const weekdayZeroBased = local.getUTCDay(); // 0=domingo ... 6=sábado
    return { y, m, d, weekdayZeroBased };
  }

  private formatLocal(date: Date) {
    const parts = new Intl.DateTimeFormat('es-AR', {
      timeZone: this.timeZone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    })
      .formatToParts(date)
      .reduce<Record<string, string>>((acc, p) => {
        acc[p.type] = p.value;
        return acc;
      }, {});

    return {
      date: `${parts.year}-${parts.month}-${parts.day}`,
      time: `${parts.hour}:${parts.minute}`,
      label: `${parts.day}/${parts.month}/${parts.year} ${parts.hour}:${parts.minute}`,
    };
  }

  async findByVehicle(vehicleId: number) {
    return this.bookingsRepo.find({
      where: { vehicle: { id: vehicleId } },
      relations: ['customer', 'vehicle', 'commonIssues', 'customer'],
      order: { scheduledAt: 'DESC' },
    });
  }

  async findByPart(partId: number) {
    return this.bookingsRepo.find({
      where: { part: { id: partId } },
      relations: ['customer', 'part', 'commonIssues', 'customer'],
      order: { scheduledAt: 'DESC' },
    });
  }

  async create(dto: CreateBookingDto, requestedById?: number) {
    const duration = await this.computeDurationMinutes(dto);
    const requestedBy = requestedById ? await this.usersService.findById(requestedById) : null;
    const createdWithBooking = !dto.customerId && !!dto.createCustomer;

    const customer = dto.customerId
      ? await this.usersService.findById(dto.customerId)
      : await this.ensureCustomer(dto);
    if (!customer) throw new NotFoundException('Cliente no encontrado');

    const issueIds = dto.commonIssueIds || [];
    const issues = issueIds.length > 0
      ? await this.issuesRepo.find({
          where: { id: In(issueIds) },
          relations: ['partCategory'],
        })
      : [];

    if (issues.length !== issueIds.length) {
      throw new BadRequestException('Alguna falla seleccionada no existe');
    }

    let vehicle: Vehicle | null = null;
    let part: Part | null = null;
    let selectedCategory: PartCategory | null = null;

    if (dto.assetType === AssetType.VEHICLE) {
      // NOTE: Se permite seleccionar fallas con categoría de parte para vehículos,
      // ya que un vehículo contiene partes.
      // const invalid = issues.filter((i) => i.partCategory);
      // if (invalid.length) {
      //   throw new BadRequestException('Alguna falla no corresponde a vehículos');
      // }

      const existingVehicleId = dto.existingVehicleId || dto.vehicleId;
      if (existingVehicleId) {
        vehicle = await this.vehiclesRepo.findOne({
          where: { id: existingVehicleId },
          relations: ['owner', 'type', 'brand'],
        });

        if (!vehicle || vehicle.owner.id !== customer.id) {
          throw new BadRequestException('Vehículo inválido para el cliente');
        }
      } else {
        if (!dto.vehicle) throw new BadRequestException('Datos del vehículo requeridos');

        const vehicleType = await this.vehicleTypesRepo.findOne({ where: { id: dto.vehicle.typeId } });
        if (!vehicleType) {
          throw new BadRequestException('Tipo de vehículo inválido');
        }

        let vehicleBrand: VehicleBrand | null = null;
        if (dto.vehicle.brandId) {
          vehicleBrand = await this.vehicleBrandsRepo.findOne({ where: { id: dto.vehicle.brandId } });
          if (!vehicleBrand) {
            throw new BadRequestException('Marca de vehículo inválida');
          }
        }

        if (!vehicleBrand && !dto.vehicle.brandOther?.trim()) {
          throw new BadRequestException('Debes seleccionar una marca o especificar "Otros"');
        }

        vehicle = await this.vehiclesRepo.save(
          this.vehiclesRepo.create({
            owner: customer,
            type: vehicleType,
            brand: vehicleBrand ?? undefined,
            brandOther: dto.vehicle.brandOther?.trim() || null,
            model: dto.vehicle.model,
            year: dto.vehicle.year,
            vinOrPlate: dto.vehicle.vinOrPlate,
            notes: dto.vehicle.notes,
          }),
        );
      }
    } else {
      if (!dto.part) throw new BadRequestException('Datos de la pieza requeridos');

      if (!dto.part.partCategoryId) {
        throw new BadRequestException('Categoría de pieza requerida');
      }

      selectedCategory = await this.partCategoriesRepo.findOne({
        where: { id: dto.part.partCategoryId },
      });
      if (!selectedCategory) {
        throw new BadRequestException('Categoría de pieza inexistente');
      }

      const invalid = issues.filter(
        (i) => i.partCategory && i.partCategory.id !== selectedCategory?.id,
      );
      if (invalid.length) {
        throw new BadRequestException(
          'Alguna falla no corresponde a la categoría de la pieza seleccionada',
        );
      }

      part = await this.partsRepo.save(
        this.partsRepo.create({
          owner: customer,
          category: selectedCategory,
          description: dto.part.description,
        }),
      );
    }

    // Default to SPECIFIC if not provided
    const timeType = dto.timeType ?? BookingTimeType.SPECIFIC;

    await this.ensureSlotAvailable(dto.scheduledAt, duration, timeType);

    const booking = this.bookingsRepo.create({
      code: randomUUID(),
      status: dto.status ?? BookingStatus.PENDING,
      assetType: dto.assetType,
      timeType,
      requestedBy: requestedBy ?? undefined,
      customer,
      vehicle: vehicle ?? undefined,
      part: part ?? undefined,
      commonIssues: issues,
      customIssues: dto.customIssues,
      details: dto.details,
      mediaUrl: dto.mediaUrl,
      scheduledAt: dto.scheduledAt,
      durationMinutes: duration,
    });

    const saved = await this.bookingsRepo.save(booking);

    // Notify logic
    const isCreatorAdmin = requestedBy?.role === Role.ADMIN;
    if (isCreatorAdmin && customer) {
      await this.notificationsService.create(
        customer,
        'Nuevo turno asignado',
        `Te han asignado un turno para el ${this.formatLocal(saved.scheduledAt).label}`,
        NotificationType.INFO,
        saved.id,
      );
    } else if (!isCreatorAdmin) {
      // User created it (or public) -> Notify admins
      const admins = await this.usersService.findAdmins();
      for (const admin of admins) {
        await this.notificationsService.create(
          admin,
          'Nuevo turno solicitado',
          `El cliente ${customer.fullName || customer.email} ha solicitado un turno para el ${
            this.formatLocal(saved.scheduledAt).label
          }`,
          NotificationType.INFO,
          saved.id,
        );
      }
    }

    if (customer.email) {
      await this.mailService.sendBookingConfirmation(customer.email, {
        code: saved.code,
        scheduledAt: saved.scheduledAt,
        assetType: saved.assetType,
        customerName: customer.fullName ?? undefined,
        credentials:
          createdWithBooking && dto.createCustomer?.password
            ? { email: customer.email, password: dto.createCustomer.password }
            : undefined,
      });
    }

    return saved;
  }

  async findOne(id: number) {
    const booking = await this.bookingsRepo.findOne({
      where: { id },
      relations: ['customer', 'vehicle', 'vehicle.type', 'vehicle.brand', 'part', 'requestedBy', 'usedParts'],
    });
    if (!booking) throw new NotFoundException('Turno no encontrado');
    return booking;
  }

  async findAll() {
    return this.bookingsRepo.find({
      relations: ['customer', 'vehicle', 'vehicle.type', 'vehicle.brand', 'part', 'requestedBy'],
      order: { scheduledAt: 'DESC' },
    });
  }

  async findByCustomer(customerId: number) {
    return this.bookingsRepo.find({
      where: { customer: { id: customerId } },
      relations: ['customer', 'vehicle', 'vehicle.type', 'vehicle.brand', 'part', 'requestedBy'],
      order: { scheduledAt: 'DESC' },
    });
  }

  async summaryFor(user: User) {
    const where = user.role === Role.ADMIN ? {} : { customer: { id: user.id } };

    const total = await this.bookingsRepo.count({ where });
    const byStatus: Record<BookingStatus, number> = {
      [BookingStatus.PENDING]: await this.bookingsRepo.count({ where: { ...where, status: BookingStatus.PENDING } }),
      [BookingStatus.CONFIRMED]: await this.bookingsRepo.count({ where: { ...where, status: BookingStatus.CONFIRMED } }),
      [BookingStatus.IN_PROGRESS]: await this.bookingsRepo.count({ where: { ...where, status: BookingStatus.IN_PROGRESS } }),
      [BookingStatus.DONE]: await this.bookingsRepo.count({ where: { ...where, status: BookingStatus.DONE } }),
      [BookingStatus.CANCELED]: await this.bookingsRepo.count({ where: { ...where, status: BookingStatus.CANCELED } }),
    };

    const upcoming = await this.bookingsRepo.findOne({
      where: { ...where, scheduledAt: MoreThan(new Date()) },
      order: { scheduledAt: 'ASC' },
      relations: ['customer', 'vehicle', 'part'],
    });

    return { total, byStatus, upcoming };
  }

  async updateStatus(id: number, status: BookingStatus) {
    const booking = await this.bookingsRepo.findOne({ where: { id }, relations: ['customer'] });
    if (!booking) throw new NotFoundException('Turno no encontrado');

    const oldStatus = booking.status;
    booking.status = status;
    const saved = await this.bookingsRepo.save(booking);

    if (oldStatus !== status && booking.customer) {
      await this.notificationsService.create(
        booking.customer,
        'Estado de turno actualizado',
        `Tu turno se encuentra ahora en estado: ${status}`,
        NotificationType.INFO,
        booking.id,
      );
    }

    return saved;
  }

  async ensureSlotAvailable(scheduledAt: Date, durationMinutes: number, timeType: BookingTimeType = BookingTimeType.SPECIFIC) {
    const start = scheduledAt;
    const end = new Date(start.getTime() + durationMinutes * 60000);

    const { y, m, d, weekdayZeroBased } = this.getLocalDateParts(start);
    const dateStr = `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;

    const blocked = await this.blocksRepo.findOne({ where: { date: dateStr } });
    if (blocked) {
      console.warn('[booking] día bloqueado', { dateStr, startUtc: start.toISOString() });
      throw new BadRequestException('Día no disponible');
    }

    // If it's a shift type (MORNING/AFTERNOON), we only check strict workdays if we want to enforce
    // that the shift exists. Assuming "Morning" falls in morning work hours.
    // For simplicity, we just check if it's a valid workday generally.

    const weekday = weekdayZeroBased;
    const [workdays, override] = await Promise.all([
      this.workdaysRepo.find({ where: { weekday, isActive: true }, order: { startTime: 'ASC' } }),
      this.overridesRepo.findOne({ where: { date: dateStr } }),
    ]);
    if (!workdays.length) {
      console.warn('[booking] sin jornada activa', { dateStr, weekday, startUtc: start.toISOString() });
      throw new BadRequestException('Fuera del horario laboral');
    }

    const totalMax = override?.maxBookings ?? workdays.reduce((sum, w) => sum + (w.maxBookings ?? 0), 0);
    let withinAny = false;
    
    // Check strict time boundaries only for SPECIFIC time bookings
    if (timeType === BookingTimeType.SPECIFIC) {
      for (const wd of workdays) {
        const within = this.isWithinWorkday(start, end, wd, y, m - 1, d);
        if (within) {
          withinAny = true;
          break;
        }
      }

      if (!withinAny) {
        const startLocal = this.formatLocal(start);
        const endLocal = this.formatLocal(end);
        console.warn('[booking] horario fuera de disponibilidad', {
          dateStr,
          weekday,
          workdays,
          startUtc: start.toISOString(),
          endUtc: end.toISOString(),
          startLocal,
          endLocal,
        });
        throw new BadRequestException(
          `Horario fuera de disponibilidad. Seleccionado ${startLocal.time}-${endLocal.time} (${startLocal.date}).`
        );
      }
    } else {
        // For shift bookings, we imply it's valid if there are workdays.
        withinAny = true; 
    }

    const dayStart = this.localToUtc(y, m - 1, d, 0, 0, 0);
    const dayEnd = this.localToUtc(y, m - 1, d, 23, 59, 59);

    const sameDayBookings = await this.bookingsRepo.find({
      where: {
        scheduledAt: betweenDates(dayStart, dayEnd),
      },
    });

    if (sameDayBookings.length >= totalMax) {
      throw new BadRequestException('Se alcanzó el máximo de turnos para el día');
    }

    // Skip overlap check for shift based bookings
    if (timeType !== BookingTimeType.SPECIFIC) {
        return;
    }

    const hasOverlap = sameDayBookings.some((b) => {
      // Don't check overlap against other shift-based bookings, as they don't block specific times
      if (b.timeType && b.timeType !== BookingTimeType.SPECIFIC) return false;

      const bEnd = new Date(b.scheduledAt.getTime() + b.durationMinutes * 60000);
      return overlapsRange(start, end, b.scheduledAt, bEnd);
    });

    // NOTE: Se permite solapamiento explicitamente
    // if (hasOverlap) {
    //   throw new BadRequestException('Ya existe un turno en ese horario');
    // }
  }

  private async computeDurationMinutes(dto: CreateBookingDto) {
    if (dto.durationMinutes) return dto.durationMinutes;

    if (dto.commonIssueIds && dto.commonIssueIds.length > 0) {
      const issues = await this.issuesRepo.find({ where: { id: In(dto.commonIssueIds) } });
      const total = issues.reduce((sum, issue) => sum + (issue.durationMinutes ?? 0), 0);
      if (total > 0) return total;
    }

    return dto.assetType === AssetType.VEHICLE ? 60 : 45;
  }

  private isWithinWorkday(start: Date, end: Date, workday: Workday, year: number, monthIndex: number, day: number) {
    const [sH, sM] = workday.startTime.split(':').map(Number);
    const [eH, eM] = workday.endTime.split(':').map(Number);

    const wdStart = this.localToUtc(year, monthIndex, day, sH, sM, 0);
    const wdEnd = this.localToUtc(year, monthIndex, day, eH, eM, 0);

    return start >= wdStart && end <= wdEnd;
  }

  private async ensureCustomer(dto: CreateBookingDto) {
    if (!dto.createCustomer) return null;
    const password = dto.createCustomer.password?.trim() || randomUUID().slice(0, 12);
    return this.usersService.create({
      email: dto.createCustomer.email,
      password,
      fullName: dto.createCustomer.fullName,
      phone: dto.createCustomer.phone,
    });
  }

  async searchCustomers(query: string) {
    const results = await this.usersService.searchClients(query, 15);
    return results.map((u) => ({ id: u.id, email: u.email, fullName: u.fullName }));
  }

  async listCustomerVehicles(customerId: number) {
    return this.vehiclesRepo.find({
      where: { owner: { id: customerId } },
      relations: ['owner', 'type', 'brand'],
      order: { id: 'DESC' },
    });
  }

  async addUsedPart(bookingId: number, dto: CreateUsedPartDto) {
    const booking = await this.bookingsRepo.findOne({ where: { id: bookingId } });
    if (!booking) throw new NotFoundException('Turno no encontrado');

    const usedPart = this.usedPartsRepo.create({
      name: dto.name,
      quantity: dto.quantity,
      booking,
    });
    return this.usedPartsRepo.save(usedPart);
  }

  async removeUsedPart(bookingId: number, partId: number) {
    const part = await this.usedPartsRepo.findOne({
      where: { id: partId, booking: { id: bookingId } },
    });
    if (!part) throw new NotFoundException('Repuesto no encontrado en este turno');
    return this.usedPartsRepo.remove(part);
  }

  async updateDetails(bookingId: number, details: string) {
    const booking = await this.bookingsRepo.findOne({ where: { id: bookingId } });
    if (!booking) throw new NotFoundException('Turno no encontrado');
    booking.details = details;
    return this.bookingsRepo.save(booking);
  }

  async updateRepairNotes(bookingId: number, notes: string) {
    const booking = await this.bookingsRepo.findOne({ where: { id: bookingId } });
    if (!booking) throw new NotFoundException('Turno no encontrado');
    booking.repairNotes = notes;
    return this.bookingsRepo.save(booking);
  }
}

