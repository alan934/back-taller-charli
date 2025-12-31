import { Injectable, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { instanceToPlain } from 'class-transformer';
import * as bcrypt from 'bcryptjs';
import { Repository } from 'typeorm';
import { Role } from '../../common/enums/role.enum';
import { User } from './entities/user.entity';

interface CreateUserInput {
  email: string;
  password: string;
  fullName?: string;
  phone?: string;
  role?: Role;
}

@Injectable()
export class UsersService {
  constructor(@InjectRepository(User) private readonly usersRepo: Repository<User>) {}

  async create(input: CreateUserInput): Promise<User> {
    const exists = await this.usersRepo.exists({ where: { email: input.email } });
    if (exists) {
      throw new ConflictException('Email already registered');
    }

    const user = this.usersRepo.create({
      email: input.email.toLowerCase(),
      fullName: input.fullName,
      phone: input.phone,
      password: await bcrypt.hash(input.password, 12),
      role: input.role ?? Role.CLIENT,
    });

    return this.usersRepo.save(user);
  }

  async findByEmail(email: string, includePassword = false): Promise<User | null> {
    if (includePassword) {
      return this.usersRepo.findOne({
        where: { email: email.toLowerCase() },
        select: ['id', 'email', 'fullName', 'phone', 'password', 'role', 'createdAt', 'updatedAt'],
      });
    }

    return this.usersRepo.findOne({ where: { email: email.toLowerCase() } });
  }

  async findById(id: number): Promise<User | null> {
    return this.usersRepo.findOne({ where: { id } });
  }

  sanitizeUser(user: User): Record<string, unknown> {
    return instanceToPlain(user);
  }
}
