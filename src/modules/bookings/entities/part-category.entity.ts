import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
  Unique,
} from 'typeorm';
import { Part } from './part.entity';
import { Issue } from './issue.entity';

@Entity({ name: 'part_categories' })
@Unique(['code'])
export class PartCategory {
  @PrimaryGeneratedColumn('increment')
  id: number;

  @Column({ type: 'varchar', length: 60 })
  code: string;

  @Column({ type: 'varchar', length: 120 })
  name: string;

  @OneToMany(() => Part, (part) => part.category)
  parts: Part[];

  @OneToMany(() => Issue, (issue) => issue.partCategory)
  issues: Issue[];

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}
