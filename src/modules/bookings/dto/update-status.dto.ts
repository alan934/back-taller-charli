import { IsEnum } from 'class-validator';
import { BookingStatus } from '../enums/booking-status.enum';

export class UpdateStatusDto {
  @IsEnum(BookingStatus)
  status!: BookingStatus;
}
