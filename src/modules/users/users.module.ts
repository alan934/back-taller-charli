import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { UsersService } from './users.service';
import { UsersSeeder } from './users.seeder';
import { UsersController } from './users.controller';
import { Vehicle } from '../bookings/entities/vehicle.entity';
import { VehicleTypeEntity } from '../bookings/entities/vehicle-type.entity';
import { VehicleBrand } from '../bookings/entities/vehicle-brand.entity';
import { Part } from '../bookings/entities/part.entity';
import { PartCategory } from '../bookings/entities/part-category.entity';

@Module({
  imports: [TypeOrmModule.forFeature([User, Vehicle, VehicleTypeEntity, VehicleBrand, Part, PartCategory]), ConfigModule],
  controllers: [UsersController],
  providers: [UsersService, UsersSeeder],
  exports: [UsersService],
})
export class UsersModule {}
