import { Column, Entity, PrimaryGeneratedColumn, Unique } from 'typeorm';

@Entity({ name: 'workday_overrides' })
@Unique(['date'])
export class WorkdayOverride {
  @PrimaryGeneratedColumn('increment')
  id: number;

  @Column({ type: 'varchar', length: 10 })
  date: string; // YYYY-MM-DD

  @Column({ type: 'int' })
  maxBookings: number;
}
