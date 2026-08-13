import { Injectable, Logger } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);

  constructor(private readonly mailerService: MailerService) {}

  async sendWelcome(to: string, name: string, tempPassword: string) {
    try {
      await this.mailerService.sendMail({
        to,
        subject: 'Welcome to PetroFlow ERP — Your Account Details',
        html: `
          <h2>Welcome, ${name}!</h2>
          <p>Your account has been created on <strong>PetroFlow ERP</strong>.</p>
          <p><strong>Email:</strong> ${to}</p>
          <p><strong>Temporary Password:</strong> <code>${tempPassword}</code></p>
          <p>Please login and change your password immediately.</p>
          <hr/>
          <small>PetroFlow ERP &mdash; Confidential</small>
        `,
      });
      this.logger.log(`Welcome email sent to ${to}`);
    } catch (err) {
      this.logger.error(`Failed to send welcome email to ${to}`, err);
    }
  }

  async sendPasswordReset(to: string, resetLink: string) {
    try {
      await this.mailerService.sendMail({
        to,
        subject: 'PetroFlow ERP — Password Reset Request',
        html: `
          <h2>Password Reset</h2>
          <p>Click the link below to reset your password. This link expires in <strong>1 hour</strong>.</p>
          <p><a href="${resetLink}" style="background:#2563eb;color:white;padding:10px 20px;border-radius:6px;text-decoration:none;">Reset Password</a></p>
          <p>If you did not request this, ignore this email.</p>
          <hr/>
          <small>PetroFlow ERP &mdash; Confidential</small>
        `,
      });
      this.logger.log(`Password reset email sent to ${to}`);
    } catch (err) {
      this.logger.error(`Failed to send reset email to ${to}`, err);
    }
  }

  async sendGeneric(to: string, subject: string, html: string) {
    try {
      await this.mailerService.sendMail({ to, subject, html });
    } catch (err) {
      this.logger.error(`Failed to send email to ${to}`, err);
    }
  }
}
