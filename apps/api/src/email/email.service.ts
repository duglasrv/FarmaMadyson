import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private transporter: nodemailer.Transporter | null = null;
  private readonly fromAddress: string;
  private readonly fromName: string;
  private readonly frontendUrl: string;

  constructor(private readonly config: ConfigService) {
    this.fromAddress = this.config.get<string>('SMTP_FROM', 'noreply@farmamadyson.com');
    this.fromName = this.config.get<string>('SMTP_FROM_NAME', 'Farma Madyson');
    this.frontendUrl = this.config.get<string>('FRONTEND_URL', 'http://localhost:3000');

    const host = this.config.get<string>('SMTP_HOST');
    if (host) {
      this.transporter = nodemailer.createTransport({
        host,
        port: this.config.get<number>('SMTP_PORT', 587),
        secure: this.config.get<number>('SMTP_PORT', 587) === 465,
        auth: {
          user: this.config.get<string>('SMTP_USER'),
          pass: this.config.get<string>('SMTP_PASS'),
        },
      });
      this.logger.log('Email transporter configured');
    } else {
      this.logger.warn('SMTP not configured — emails will be logged to console');
    }
  }

  private async send(to: string, subject: string, html: string): Promise<void> {
    if (!this.transporter) {
      this.logger.warn(`[EMAIL-DEV] To: ${to} | Subject: ${subject}`);
      this.logger.warn(`[EMAIL-DEV] Body preview: ${html.substring(0, 200)}`);
      return;
    }

    try {
      await this.transporter.sendMail({
        from: `"${this.fromName}" <${this.fromAddress}>`,
        to,
        subject,
        html,
      });
      this.logger.log(`Email sent to ${to}: ${subject}`);
    } catch (error) {
      this.logger.error(`Failed to send email to ${to}: ${error}`);
    }
  }

  async sendTwoFactorCode(email: string, code: string): Promise<void> {
    const html = `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 24px;">
        <h2 style="color: #16a34a; margin-bottom: 16px;">Código de verificación</h2>
        <p>Tu código de verificación para iniciar sesión en Farma Madyson es:</p>
        <div style="text-align: center; margin: 24px 0;">
          <span style="font-size: 32px; font-weight: bold; letter-spacing: 8px; background: #f0fdf4; padding: 12px 24px; border-radius: 8px; color: #16a34a;">
            ${code}
          </span>
        </div>
        <p style="color: #6b7280; font-size: 14px;">Este código expira en 5 minutos. Si no solicitaste este código, ignora este mensaje.</p>
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;">
        <p style="color: #9ca3af; font-size: 12px;">Farma Madyson — Tu farmacia de confianza</p>
      </div>
    `;
    await this.send(email, 'Código de verificación - Farma Madyson', html);
  }

  async sendPasswordReset(email: string, token: string): Promise<void> {
    const resetUrl = `${this.frontendUrl}/restablecer-contrasena?token=${encodeURIComponent(token)}`;
    const html = `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 24px;">
        <h2 style="color: #16a34a; margin-bottom: 16px;">Restablecer contraseña</h2>
        <p>Recibimos una solicitud para restablecer la contraseña de tu cuenta en Farma Madyson.</p>
        <div style="text-align: center; margin: 24px 0;">
          <a href="${resetUrl}" style="display: inline-block; background: #16a34a; color: white; padding: 12px 32px; border-radius: 8px; text-decoration: none; font-weight: 600;">
            Restablecer contraseña
          </a>
        </div>
        <p style="color: #6b7280; font-size: 14px;">Este enlace expira en 1 hora. Si no solicitaste restablecer tu contraseña, ignora este mensaje.</p>
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;">
        <p style="color: #9ca3af; font-size: 12px;">Farma Madyson — Tu farmacia de confianza</p>
      </div>
    `;
    await this.send(email, 'Restablecer contraseña - Farma Madyson', html);
  }

  async sendVerificationEmail(email: string, token: string): Promise<void> {
    const verifyUrl = `${this.frontendUrl}/verificar-email?token=${encodeURIComponent(token)}`;
    const html = `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 24px;">
        <h2 style="color: #16a34a; margin-bottom: 16px;">Verifica tu email</h2>
        <p>Gracias por registrarte en Farma Madyson. Haz clic en el botón para verificar tu dirección de correo electrónico.</p>
        <div style="text-align: center; margin: 24px 0;">
          <a href="${verifyUrl}" style="display: inline-block; background: #16a34a; color: white; padding: 12px 32px; border-radius: 8px; text-decoration: none; font-weight: 600;">
            Verificar email
          </a>
        </div>
        <p style="color: #6b7280; font-size: 14px;">Este enlace expira en 24 horas.</p>
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;">
        <p style="color: #9ca3af; font-size: 12px;">Farma Madyson — Tu farmacia de confianza</p>
      </div>
    `;
    await this.send(email, 'Verifica tu email - Farma Madyson', html);
  }

  async sendOrderConfirmation(email: string, order: { id: string; total: number; itemCount: number }): Promise<void> {
    const orderUrl = `${this.frontendUrl}/mis-pedidos/${order.id}`;
    const html = `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 24px;">
        <h2 style="color: #16a34a; margin-bottom: 16px;">Pedido confirmado</h2>
        <p>Tu pedido ha sido recibido y está siendo procesado.</p>
        <div style="background: #f0fdf4; padding: 16px; border-radius: 8px; margin: 16px 0;">
          <p style="margin: 4px 0;"><strong>Pedido:</strong> #${order.id.substring(0, 8).toUpperCase()}</p>
          <p style="margin: 4px 0;"><strong>Productos:</strong> ${order.itemCount}</p>
          <p style="margin: 4px 0;"><strong>Total:</strong> $${order.total.toFixed(2)} MXN</p>
        </div>
        <div style="text-align: center; margin: 24px 0;">
          <a href="${orderUrl}" style="display: inline-block; background: #16a34a; color: white; padding: 12px 32px; border-radius: 8px; text-decoration: none; font-weight: 600;">
            Ver pedido
          </a>
        </div>
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;">
        <p style="color: #9ca3af; font-size: 12px;">Farma Madyson — Tu farmacia de confianza</p>
      </div>
    `;
    await this.send(email, 'Pedido confirmado - Farma Madyson', html);
  }
}
