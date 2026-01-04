import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersModule } from '../users/users.module';
import { AgendaController } from './agenda.controller';
import { AgendaService } from './agenda.service';
import { BookingsController } from './bookings.controller';
import { BookingsService } from './bookings.service';
import { Booking } from './entities/booking.entity';
import { BookingUsedPart } from './entities/booking-used-part.entity';
import { HolidayBlock } from './entities/holiday-block.entity';
import { Issue } from './entities/issue.entity';
import { Part } from './entities/part.entity';
import { PartCategory } from './entities/part-category.entity';
import { VehicleBrand } from './entities/vehicle-brand.entity';
import { Vehicle } from './entities/vehicle.entity';
import { VehicleTypeEntity } from './entities/vehicle-type.entity';
import { Workday } from './entities/workday.entity';
import { WorkdayOverride } from './entities/workday-override.entity';
import { IssuesController } from './issues.controller';
import { IssuesService } from './issues.service';
import { MailService } from './mail.service';
import { PartCategoriesController } from './part-categories.controller';
import { PartCategoriesService } from './part-categories.service';
import { VehicleBrandsController } from './vehicle-brands.controller';
import { VehicleBrandsService } from './vehicle-brands.service';
import { VehicleTypesController } from './vehicle-types.controller';
import { VehicleTypesService } from './vehicle-types.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Booking,
      BookingUsedPart,
      Issue,
      Vehicle,
      VehicleBrand,
      VehicleTypeEntity,
      Part,
      PartCategory,
      Workday,
      WorkdayOverride,
      HolidayBlock,
    ]),
    UsersModule,
  ],
  controllers: [
    BookingsController,
    AgendaController,
    IssuesController,
    PartCategoriesController,
    VehicleBrandsController,
    VehicleTypesController,
  ],
  providers: [
    BookingsService,
    AgendaService,
    IssuesService,
    MailService,
    PartCategoriesService,
    VehicleBrandsService,
    VehicleTypesService,
  ],
})
export class BookingsModule {}
