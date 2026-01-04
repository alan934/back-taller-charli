import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Booking } from './booking.entity';

@Entity({ name: 'booking_used_parts' })
export class BookingUsedPart {
  @PrimaryGeneratedColumn('increment')
  id: number;

  @Column()
  name: string;

  @Column({ type: 'int', default: 1 })
  quantity: number;

  @ManyToOne(() => Booking, (booking) => booking.usedParts, { onDelete: 'CASCADE' })
  booking: Booking;
}
