import { registerAs } from '@nestjs/config';

export const databaseConfig = registerAs('database', () => ({
  type: 'postgres' as const,
  url: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: (process.env.DATABASE_SSL_REJECT_UNAUTHORIZED ?? 'false') === 'true',
  },
  synchronize: true,
}));
