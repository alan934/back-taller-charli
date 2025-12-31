import { registerAs } from '@nestjs/config';
import Joi from 'joi';

export const envValidationSchema = Joi.object({
  PORT: Joi.number().default(3001),
  JWT_SECRET: Joi.string().min(16).required(),
  JWT_EXPIRES_IN: Joi.string().default('1h'),
  DATABASE_URL: Joi.string().uri().required(),
  DATABASE_SSL_REJECT_UNAUTHORIZED: Joi.boolean().default(false),
  FRONTEND_ORIGIN: Joi.string().optional(),
  SMTP_HOST: Joi.string().default('smtp.gmail.com'),
  SMTP_PORT: Joi.number().default(465),
  SMTP_USER: Joi.string().optional(),
  SMTP_PASSWORD: Joi.string().optional(),
  SMTP_FROM: Joi.string().email().optional(),
  ADMIN_EMAIL: Joi.string().email().default('admin@tallercharli.com'),
  ADMIN_PASSWORD: Joi.string().min(8).default('Admin1234*'),
  ADMIN_FULLNAME: Joi.string().default('Administrador Taller'),
});

export const appConfig = registerAs('app', () => ({
  port: parseInt(process.env.PORT ?? '3001', 10),
  jwtSecret: process.env.JWT_SECRET ?? '',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN ?? '1h',
  frontendOrigin: process.env.FRONTEND_ORIGIN,
}));
