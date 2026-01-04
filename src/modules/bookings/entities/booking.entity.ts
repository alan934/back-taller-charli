import {
  Column,
  CreateDateColumn,
  Entity,
  JoinTable,
  ManyToMany,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { AssetType } from '../enums/asset-type.enum';
import { BookingStatus } from '../enums/booking-status.enum';
import { IssueKind } from '../enums/issue-kind.enum';
import { Issue } from './issue.entity';
import { Part } from './part.entity';
import { Vehicle } from './vehicle.entity';
import { BookingUsedPart } from './booking-used-part.entity';
import { OneToMany } from 'typeorm';

@Entity({ name: 'bookings' })
export class Booking {
  @PrimaryGeneratedColumn('increment')
  id: number;

  @Column({ type: 'uuid' })
  code: string;

  @Column({ type: 'enum', enum: BookingStatus, default: BookingStatus.PENDING })
  status: BookingStatus;

  @Column({ type: 'enum', enum: AssetType })
  assetType: AssetType;

  @ManyToOne(() => User, { onDelete: 'SET NULL', nullable: true })
  requestedBy?: User | null;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  customer: User;

  @ManyToOne(() => Vehicle, { onDelete: 'SET NULL', nullable: true })
  vehicle?: Vehicle | null;

  @ManyToOne(() => Part, { onDelete: 'SET NULL', nullable: true })
  part?: Part | null;

  @OneToMany(() => BookingUsedPart, (usedPart) => usedPart.booking, { eager: true, cascade: true })
  usedParts: BookingUsedPart[];

  @ManyToMany(() => Issue, { eager: true })
  @JoinTable({ name: 'booking_common_issues' })
  commonIssues: Issue[];

  @Column({ type: 'text', array: true, nullable: true })
  customIssues?: string[] | null;

  @Column({ type: 'text', nullable: true })
  details?: string | null;

  @Column({ type: 'varchar', length: 500, nullable: true })
  mediaUrl?: string | null;

  @Column({ type: 'timestamptz' })
  scheduledAt: Date;

  @Column({ type: 'int', default: 60 })
  durationMinutes: number;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}
