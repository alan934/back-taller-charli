import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'holiday_blocks' })
export class HolidayBlock {
  @PrimaryGeneratedColumn('increment')
  id: number;

  @Column({ type: 'date' })
  date: string; // YYYY-MM-DD

  @Column({ type: 'varchar', length: 255, nullable: true })
  reason?: string | null;
}
