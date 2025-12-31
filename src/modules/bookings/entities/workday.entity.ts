import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'workdays' })
export class Workday {
  @PrimaryGeneratedColumn('increment')
  id: number;

  @Column({ type: 'int' })
  weekday: number; // 0 = domingo ... 6 = sábado

  @Column({ type: 'varchar', length: 5 })
  startTime: string; // HH:mm

  @Column({ type: 'varchar', length: 5 })
  endTime: string; // HH:mm

  @Column({ default: true })
  isActive: boolean;

  @Column({ type: 'int', default: 6 })
  maxBookings: number;
}
