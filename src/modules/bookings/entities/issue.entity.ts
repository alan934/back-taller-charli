import { Column, Entity, ManyToMany, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { IssueKind } from '../enums/issue-kind.enum';
import { Booking } from './booking.entity';
import { PartCategory } from './part-category.entity';

@Entity({ name: 'issues' })
export class Issue {
  @PrimaryGeneratedColumn('increment')
  id: number;

  @Column({ type: 'enum', enum: IssueKind })
  kind: IssueKind;

  @Column({ unique: true })
  label: string;

  @Column({ type: 'int', default: 30 })
  durationMinutes: number;

  @ManyToOne(() => PartCategory, (category) => category.issues, {
    nullable: true,
    onDelete: 'SET NULL',
    eager: true,
  })
  partCategory?: PartCategory | null;

  @ManyToMany(() => Booking, (booking) => booking.commonIssues)
  bookings: Booking[];
}
