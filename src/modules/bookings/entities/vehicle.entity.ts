import { Column, Entity, ManyToOne, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { VehicleBrand } from './vehicle-brand.entity';
import { VehicleTypeEntity } from './vehicle-type.entity';
import { Booking } from './booking.entity';

@Entity({ name: 'vehicles' })
export class Vehicle {
  @PrimaryGeneratedColumn('increment')
  id: number;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  owner: User;

  @ManyToOne(() => VehicleTypeEntity, { eager: true })
  type: VehicleTypeEntity;

  @ManyToOne(() => VehicleBrand, { nullable: true, eager: true })
  brand?: VehicleBrand | null;

  @Column({ type: 'varchar', length: 120, nullable: true })
  brandOther?: string | null;

  @Column()
  model: string;

  @Column({ nullable: true })
  year?: number;

  @Column({ nullable: true })
  vinOrPlate?: string;

  @Column({ type: 'text', nullable: true })
  notes?: string;

  @OneToMany(() => Booking, (booking) => booking.vehicle)
  bookings: Booking[];
}
