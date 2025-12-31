import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AssetType } from './enums/asset-type.enum';
import { Booking } from './entities/booking.entity';
import { HolidayBlock } from './entities/holiday-block.entity';
import { Workday } from './entities/workday.entity';
import { WorkdayOverride } from './entities/workday-override.entity';
import { AvailabilityQueryDto } from './dto/availability.dto';
import { UpsertWorkdaysDto } from './dto/workday.dto';
import { betweenDates } from './helpers/typeorm-between.util';
import { overlapsRange } from './helpers/booking-overlap.util';

@Injectable()
export class AgendaService {
  private readonly timeZone = 'America/Argentina/Buenos_Aires';
  // Argentina has fixed UTC-3 with no DST; use explicit offset to avoid ICU/timezone issues
  private readonly offsetMinutes = -180; // local = UTC - 3h

  constructor(
    @InjectRepository(Workday) private readonly workdaysRepo: Repository<Workday>,
    @InjectRepository(HolidayBlock) private readonly blocksRepo: Repository<HolidayBlock>,
    @InjectRepository(Booking) private readonly bookingsRepo: Repository<Booking>,
    @InjectRepository(WorkdayOverride)
    private readonly overridesRepo: Repository<WorkdayOverride>,
  ) {}

  // Interpret HH:mm as local (UTC-3) and return Date in UTC
  private localToUtc(year: number, monthIndex: number, day: number, hour = 0, minute = 0, second = 0) {
    const utcMs = Date.UTC(year, monthIndex, day, hour, minute, second) - this.offsetMinutes * 60000;
    return new Date(utcMs);
  }

  // Convert a UTC date to local parts using the fixed offset
  private getLocalDateParts(date: Date) {
    const local = new Date(date.getTime() + this.offsetMinutes * 60000);
    const y = local.getUTCFullYear();
    const m = local.getUTCMonth() + 1;
    const d = local.getUTCDate();
    const weekdayZeroBased = local.getUTCDay(); // 0=domingo ... 6=sábado
    return { y, m, d, weekdayZeroBased };
  }

  async listWorkdays() {
    const [workdays, overrides] = await Promise.all([
      this.workdaysRepo.find({ order: { weekday: 'ASC' } }),
      this.overridesRepo.find({ order: { date: 'ASC' } }),
    ]);
    return { workdays, overrides };
  }

  async upsertWorkdays(dto: UpsertWorkdaysDto) {
    await this.workdaysRepo.clear();
    await this.overridesRepo.clear();

    const created = this.workdaysRepo.create(
      dto.workdays.map((w) => ({ ...w, isActive: w.isActive ?? true })),
    );
    const saved = await this.workdaysRepo.save(created);

    if (dto.overrides?.length) {
      const overrides = this.overridesRepo.create(dto.overrides);
      await this.overridesRepo.save(overrides);
    }

    return { workdays: saved, overrides: await this.overridesRepo.find() };
  }

  async getSlots(query: AvailabilityQueryDto) {
    const date = query.date;
    const { y, m, d, weekdayZeroBased } = this.getLocalDateParts(date);
    const dateStr = `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    const duration = query.durationMinutes ?? (query.assetType === AssetType.VEHICLE ? 60 : 45);

    const blocked = await this.blocksRepo.findOne({ where: { date: dateStr } });
    if (blocked) return { date: dateStr, slots: [] };

    const weekday = weekdayZeroBased; // 0=domingo ... 6=sabado
    const [workdays, override] = await Promise.all([
      this.workdaysRepo.find({ where: { weekday, isActive: true }, order: { startTime: 'ASC' } }),
      this.overridesRepo.findOne({ where: { date: dateStr } }),
    ]);
    if (!workdays.length) return { date: dateStr, slots: [] };

    const dayMax = override?.maxBookings ?? workdays.reduce((sum, w) => sum + (w.maxBookings ?? 0), 0);
    if (dayMax <= 0) return { date: dateStr, slots: [] };

    const dayStart = this.localToUtc(y, m - 1, d, 0, 0);
    const dayEnd = this.localToUtc(y, m - 1, d, 23, 59, 59);

    const bookings = await this.bookingsRepo.find({
      where: {
        scheduledAt: betweenDates(dayStart, dayEnd),
      },
    });

    if (bookings.length >= dayMax) {
      return { date: dateStr, slots: [] };
    }

    const slots: string[] = [];

    for (const wd of workdays) {
      const [sH, sM] = wd.startTime.split(':').map(Number);
      const [eH, eM] = wd.endTime.split(':').map(Number);

      const start = this.localToUtc(y, m - 1, d, sH, sM);
      const end = this.localToUtc(y, m - 1, d, eH, eM);

      if (start >= end) continue;

      const windowEnd = end; // no slot should start at or after endTime

      for (
        let cursor = start;
        cursor < end && bookings.length + slots.length < dayMax;
        cursor = new Date(cursor.getTime() + duration * 60000)
      ) {
        const slotEnd = new Date(cursor.getTime() + duration * 60000);
        if (slotEnd > windowEnd) break;
        const overlaps = bookings.some((b) =>
          overlapsRange(
            cursor,
            slotEnd,
            b.scheduledAt,
            new Date(b.scheduledAt.getTime() + b.durationMinutes * 60000),
          ),
        );
        if (!overlaps) {
          slots.push(cursor.toISOString());
        }
      }
    }

    if (process.env.NODE_ENV !== 'production') {
      const label = slots.length ? new Intl.DateTimeFormat('es-AR', {
        timeZone: this.timeZone,
        hour: '2-digit',
        minute: '2-digit',
      }).format(new Date(slots[0])) : 'sin slots';
      console.debug('[agenda] slots generados', { dateStr, weekday: weekdayZeroBased, count: slots.length, primeraHoraLocal: label, duration });
    }

    return { date: dateStr, slots };
  }
}
