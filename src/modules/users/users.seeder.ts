import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Role } from '../../common/enums/role.enum';
import { UsersService } from './users.service';

@Injectable()
export class UsersSeeder implements OnApplicationBootstrap {
  private readonly logger = new Logger(UsersSeeder.name);

  constructor(
    private readonly usersService: UsersService,
    private readonly configService: ConfigService,
  ) {}

  async onApplicationBootstrap() {
    const email = this.configService.get<string>('ADMIN_EMAIL');
    const password = this.configService.get<string>('ADMIN_PASSWORD');
    const fullName = this.configService.get<string>('ADMIN_FULLNAME');

    if (!email || !password) {
      this.logger.warn('Admin seed skipped: missing ADMIN_EMAIL or ADMIN_PASSWORD');
      return;
    }

    const existing = await this.usersService.findByEmail(email);
    if (existing) {
      return;
    }

    await this.usersService.create({
      email,
      password,
      fullName,
      role: Role.ADMIN,
    });

    this.logger.log(`Admin user created with email: ${email}`);
  }
}
