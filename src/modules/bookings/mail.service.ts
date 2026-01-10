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

  private getTemplate(title: string, contentHtml: string): string {
    const year = new Date().getFullYear();
    const appUrl =
      this.configService.get<string>('FRONTEND_URL') ||
      this.configService.get<string>('APP_URL') ||
      'https://tallercharli.com';

    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { margin: 0; padding: 0; background-color: #f1f5f9; font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; }
    .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06); margin-top: 20px; margin-bottom: 20px; }
    .header { background-color: #0f172a; padding: 24px; text-align: center; }
    .header h1 { color: #f8fafc; margin: 0; font-size: 24px; letter-spacing: -0.5px; }
    .content { padding: 32px 24px; color: #334155; line-height: 1.6; font-size: 16px; }
    .footer { background-color: #f8fafc; padding: 24px; text-align: center; border-top: 1px solid #e2e8f0; font-size: 13px; color: #64748b; }
    .button { display: inline-block; padding: 12px 24px; background-color: #2563eb; color: #ffffff !important; text-decoration: none; border-radius: 8px; font-weight: 600; text-align: center; transition: background-color 0.2s; }
    .button:hover { background-color: #1d4ed8; }
    .card { background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; margin: 16px 0; }
    .label { font-size: 13px; color: #64748b; font-weight: 500; text-transform: uppercase; letter-spacing: 0.5px; display: block; margin-bottom: 4px; }
    .value { font-size: 16px; color: #0f172a; font-weight: 600; display: block; margin-bottom: 12px; }
    .value:last-child { margin-bottom: 0; }
  </style>
</head>
<body style="margin: 0; padding: 0; background-color: #f1f5f9; font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
  <div class="container" style="max-width: 600px; margin: 20px auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
    
    <!-- Header -->
    <div class="header" style="background-color: #0f172a; padding: 24px; text-align: center;">
      <h1 style="color: #f8fafc; margin: 0; font-size: 24px; font-family: 'Segoe UI', sans-serif;">Taller Charli</h1>
    </div>

    <!-- Main Content -->
    <div class="content" style="padding: 32px 24px; color: #334155; line-height: 1.6;">
      ${contentHtml}
    </div>

    <!-- Footer -->
    <div class="footer" style="background-color: #f8fafc; padding: 24px; text-align: center; border-top: 1px solid #e2e8f0; font-size: 13px; color: #64748b;">
      <p style="margin: 0 0 8px;">&copy; ${year} Taller Charli</p>
      <div style="margin-top: 20px;">
          <a href="${appUrl}/#/dashboard" style="display: inline-block; padding: 12px 24px; background-color: #2563eb; color: #ffffff !important; text-decoration: none; border-radius: 8px; font-weight: 600;">Ir al Panel de Control</a>
      </div>
      <p style="margin: 20px 0 0;">O podés gestionar tus turnos en <a href="${appUrl}" style="color: #2563eb; text-decoration: none;">${appUrl}</a></p>
    </div>
  </div>
</body>
</html>
    `;
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
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
    
    const when = formatter.format(payload.scheduledAt);
    const greeting = payload.customerName ? `Hola ${payload.customerName},` : 'Hola,';
    
    // Plain text version fallback
    const text = `${greeting}
Confirmamos tu turno en Taller Charli.
Código: ${payload.code}
Fecha: ${when}
Servicio: ${payload.assetType === 'VEHICLE' ? 'Vehículo completo' : 'Pieza / Repuesto'}
${payload.credentials ? `Usuario: ${payload.credentials.email}\nContraseña: ${payload.credentials.password}` : ''}
Accedé: ${appUrl}`;

    // HTML Content Construction
    let htmlContent = `
      <h2 style="margin-top: 0; color: #0f172a; font-size: 20px;">¡Tu turno está confirmado!</h2>
      <p style="margin-bottom: 24px;">${greeting} gracias por confiar en nosotros. A continuación te detallamos la información de tu cita:</p>
      
      <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px; margin-bottom: 24px;">
        <div style="margin-bottom: 16px;">
          <span style="font-size: 12px; color: #64748b; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; display: block; margin-bottom: 4px;">Código de Reserva</span>
          <span style="font-size: 24px; color: #2563eb; font-weight: 700; letter-spacing: 1px;">${payload.code}</span>
        </div>
        
        <div style="display: flex; flex-wrap: wrap; gap: 20px;">
          <div style="flex: 1; min-width: 140px; margin-bottom: 12px;">
            <span style="font-size: 12px; color: #64748b; font-weight: 600; text-transform: uppercase; display: block; margin-bottom: 4px;">Fecha y Hora</span>
            <span style="font-size: 16px; color: #0f172a; font-weight: 600;">${when} hs</span>
          </div>
          <div style="flex: 1; min-width: 140px; margin-bottom: 12px;">
            <span style="font-size: 12px; color: #64748b; font-weight: 600; text-transform: uppercase; display: block; margin-bottom: 4px;">Tipo de Servicio</span>
            <span style="font-size: 16px; color: #0f172a; font-weight: 600;">${payload.assetType === AssetType.VEHICLE ? 'Vehículo completo' : 'Pieza / Repuesto'}</span>
          </div>
        </div>
      </div>
    `;

    if (payload.credentials) {
      htmlContent += `
        <div style="background-color: #eff6ff; border: 1px solid #bfdbfe; border-radius: 8px; padding: 20px; margin-bottom: 24px;">
          <h3 style="margin: 0 0 12px; color: #1e40af; font-size: 16px;">Tus credenciales de acceso</h3>
          <p style="margin: 0 0 16px; font-size: 14px; color: #1e3a8a;">Se ha creado una cuenta para que puedas gestionar tus turnos.</p>
          
          <div style="background: #ffffff; padding: 12px; border-radius: 6px; border: 1px solid #dbeafe; margin-bottom: 16px;">
            <p style="margin: 0 0 8px;"><strong>Usuario:</strong> ${payload.credentials.email}</p>
            <p style="margin: 0;"><strong>Contraseña:</strong> ${payload.credentials.password}</p>
          </div>
          
          <div style="text-align: center;">
            <a href="${appUrl}/login" style="display: inline-block; padding: 12px 24px; background-color: #2563eb; color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: 600;">Ingresar a mi cuenta</a>
          </div>
        </div>
      `;
    } else {
      htmlContent += `
        <div style="text-align: center; margin-top: 32px; margin-bottom: 16px;">
          <a href="${appUrl}" style="display: inline-block; padding: 14px 32px; background-color: #0f172a; color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: 600; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">Ver mi turno</a>
        </div>
      `;
    }

    htmlContent += `
      <p style="color: #64748b; font-size: 14px; margin-top: 32px; text-align: center;">
        Si tenés alguna duda o necesitás reprogramar, no dudes en contactarnos.
      </p>
    `;

    await this.transporter.sendMail({
      from: `"Taller Charli" <${from}>`,
      to,
      subject: '✅ Confirmación de turno - Taller Charli',
      text,
      html: this.getTemplate('Confirmación de turno', htmlContent),
    });
  }
}
