import { Exclude } from 'class-transformer';
import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Role } from '../../../common/enums/role.enum';

@Entity({ name: 'users' })
export class User {
  @PrimaryGeneratedColumn('increment')
  id: number;

  @Column({ unique: true, nullable: true })
  email?: string;

  @Column({ nullable: true })
  fullName?: string;

  @Column({ nullable: true })
  phone?: string;

  @Exclude()
  @Column({ select: false, nullable: true })
  password?: string;

  @Column({ type: 'text', default: Role.CLIENT })
  role: Role;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;

  @Exclude()
  @Column({ default: true })
  isActive: boolean;

  @Exclude()
  @DeleteDateColumn({ type: 'timestamptz', nullable: true })
  deletedAt?: Date | null;
}
