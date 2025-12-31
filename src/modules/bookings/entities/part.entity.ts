import { Column, Entity, ManyToOne, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Booking } from './booking.entity';
import { PartCategory } from './part-category.entity';

@Entity({ name: 'parts' })
export class Part {
  @PrimaryGeneratedColumn('increment')
  id: number;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  owner: User;

  @ManyToOne(() => PartCategory, (category) => category.parts, {
    onDelete: 'RESTRICT',
    nullable: false,
    eager: true,
  })
  category: PartCategory;

  @Column({ type: 'text' })
  description: string;

  @OneToMany(() => Booking, (booking) => booking.part)
  bookings: Booking[];
}
