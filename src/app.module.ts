import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { TypeOrmModule } from '@nestjs/typeorm';
import { appConfig, envValidationSchema } from './config/env.config';
import { databaseConfig } from './config/database.config';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { User } from './modules/users/entities/user.entity';
import { BookingsModule } from './modules/bookings/bookings.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { Notification } from './modules/notifications/entities/notification.entity';
import { Booking } from './modules/bookings/entities/booking.entity';
import { Issue } from './modules/bookings/entities/issue.entity';
import { Vehicle } from './modules/bookings/entities/vehicle.entity';
import { VehicleBrand } from './modules/bookings/entities/vehicle-brand.entity';
import { Part } from './modules/bookings/entities/part.entity';
import { PartCategory } from './modules/bookings/entities/part-category.entity';
import { VehicleTypeEntity } from './modules/bookings/entities/vehicle-type.entity';
import { Workday } from './modules/bookings/entities/workday.entity';
import { HolidayBlock } from './modules/bookings/entities/holiday-block.entity';
import { WorkdayOverride } from './modules/bookings/entities/workday-override.entity';
import { BookingUsedPart } from './modules/bookings/entities/booking-used-part.entity';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env'],
      load: [appConfig, databaseConfig],
      validationSchema: envValidationSchema,
    }),
    ThrottlerModule.forRoot([{ ttl: 60, limit: 20 }]),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        url: config.getOrThrow<string>('database.url'),
        ssl: {
          rejectUnauthorized: config.get<boolean>('database.ssl.rejectUnauthorized'),
        },
        entities: [
          User,
          Booking,
          Issue,
          Vehicle,
          VehicleBrand,
          VehicleTypeEntity,
          Part,
          PartCategory,
          Workday,
          HolidayBlock,
          WorkdayOverride,
          BookingUsedPart,
          Notification,
        ],
        synchronize: config.get<boolean>('database.synchronize'),
      }),
    }),
    UsersModule,
    AuthModule,
    BookingsModule,
    NotificationsModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
    // RolesGuard is applied at the controller level alongside AuthGuard to ensure
    // the request user is already populated before role checks happen.
  ],
})
export class AppModule {}
