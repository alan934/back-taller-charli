import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import { AssetType } from './enums/asset-type.enum';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private readonly transporter: nodemailer.Transporter | null;

  constructor(private readonly configService: ConfigService) {
    const user = this.configService.get<string>('SMTP_USER');
    const pass = this.configService.get<string>('SMTP_PASSWORD');
    const host = this.configService.get<string>('SMTP_HOST');
    const port = this.configService.get<number>('SMTP_PORT') ?? 465;

    if (user && pass) {
      this.transporter = nodemailer.createTransport({
        host,
        port,
        secure: port === 465,
        auth: { user, pass },
      });
    } else {
      this.transporter = null;
      this.logger.warn('SMTP credentials not configured; email sending disabled.');
    }
  }

  async sendBookingConfirmation(
    to: string,
    payload: { code: string; scheduledAt: Date; assetType: AssetType },
  ) {
    if (!this.transporter) return;

    const from =
      this.configService.get<string>('SMTP_FROM') || this.configService.get<string>('SMTP_USER');
    const date = payload.scheduledAt.toISOString();

    await this.transporter.sendMail({
      from,
      to,
      subject: 'Confirmación de turno',
      text: `Tu turno fue registrado. Código: ${payload.code}. Fecha: ${date}. Tipo: ${payload.assetType}.`,
    });
  }
}
