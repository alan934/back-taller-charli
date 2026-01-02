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
    payload: {
      code: string;
      scheduledAt: Date;
      assetType: AssetType;
      customerName?: string;
      credentials?: { email: string; password: string };
    },
  ) {
    if (!this.transporter) return;

    const from =
      this.configService.get<string>('SMTP_FROM') || this.configService.get<string>('SMTP_USER');
    const appUrl =
      this.configService.get<string>('FRONTEND_URL') ||
      this.configService.get<string>('APP_URL') ||
      'https://tallercharli.com';

    const formatter = new Intl.DateTimeFormat('es-AR', {
      timeZone: 'America/Argentina/Buenos_Aires',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
    const parts = formatter.formatToParts(payload.scheduledAt).reduce<Record<string, string>>((acc, p) => {
      acc[p.type] = p.value;
      return acc;
    }, {});
    const when = `${parts.day}/${parts.month}/${parts.year} ${parts.hour}:${parts.minute}`;
    const greeting = payload.customerName ? `Hola ${payload.customerName},` : 'Hola,';
    const credsBlock = payload.credentials
      ? `
Usuario: ${payload.credentials.email}
Contraseña: ${payload.credentials.password}
Accedé: ${appUrl}
`
      : `
Accedé a la plataforma: ${appUrl}
`;
    const text = `${greeting}

Confirmamos tu turno en Taller Charli.
Código: ${payload.code}
Fecha y hora: ${when}
Servicio: ${payload.assetType === 'VEHICLE' ? 'Vehículo completo' : 'Pieza / Repuesto'}
${credsBlock}

Si no solicitaste este turno, por favor respondé este correo.`;

    const html = `
      <div style="font-family: 'Segoe UI', Arial, sans-serif; color: #0f1720;">
        <p style="margin: 0 0 12px; font-weight: 600;">${greeting}</p>
        <p style="margin: 0 0 16px;">Confirmamos tu turno en Taller Charli.</p>
        <div style="padding: 12px; border: 1px solid #e2e8f0; border-radius: 12px; background: #f8fafc; margin-bottom: 16px;">
          <p style="margin: 0 0 6px;"><strong>Código:</strong> ${payload.code}</p>
          <p style="margin: 0 0 6px;"><strong>Fecha y hora:</strong> ${when}</p>
          <p style="margin: 0;"><strong>Servicio:</strong> ${payload.assetType === AssetType.VEHICLE ? 'Vehículo completo' : 'Pieza / Repuesto'}</p>
        </div>
        ${
          payload.credentials
            ? `<div style="padding: 12px; border: 1px solid #cbd5e1; border-radius: 12px; background: #fff7ed; margin-bottom: 16px;">
                <p style="margin: 0 0 6px; font-weight: 600; color: #c2410c;">Acceso a la plataforma</p>
                <p style="margin: 0 0 4px;"><strong>Usuario:</strong> ${payload.credentials.email}</p>
                <p style="margin: 0 0 8px;"><strong>Contraseña:</strong> ${payload.credentials.password}</p>
                <a href="${appUrl}" style="display: inline-block; padding: 10px 14px; background: #2563eb; color: #fff; text-decoration: none; border-radius: 10px;">Ingresar</a>
              </div>`
            : `<p style="margin: 0 0 12px;">Podés gestionar tus turnos aquí: <a href="${appUrl}" style="color: #2563eb;">${appUrl}</a></p>`
        }
        <p style="margin: 0; font-size: 13px; color: #475569;">Si no solicitaste este turno, respondé este correo y lo revisaremos.</p>
      </div>
    `;

    await this.transporter.sendMail({
      from,
      to,
      subject: 'Confirmación de turno',
      text,
      html,
    });
  }
}
