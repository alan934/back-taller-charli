import { Booking } from '../entities/booking.entity';

export function overlapsRange(aStart: Date, aEnd: Date, bStart: Date, bEnd: Date) {
  return aStart < bEnd && bStart < aEnd;
}

export function bookingEnd(booking: Booking) {
  return new Date(booking.scheduledAt.getTime() + booking.durationMinutes * 60000);
}
