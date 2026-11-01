import nodemailer, { Transporter } from 'nodemailer';
import { env } from '../config/env';
import { logger } from '../utils/logger';

export interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export class EmailService {
  private static transporter: Transporter | null = null;

  /**
   * Lazily initialize or retrieve the Nodemailer transporter
   */
  private static getTransporter(): Transporter | null {
    if (this.transporter) return this.transporter;

    if (env.SMTP_HOST && env.SMTP_USER && env.SMTP_PASS) {
      const isGmail = env.SMTP_HOST.includes('gmail');
      this.transporter = nodemailer.createTransport({
        host: env.SMTP_HOST,
        port: env.SMTP_PORT || (isGmail ? 465 : 587),
        secure: env.SMTP_PORT === 465 || (isGmail && env.SMTP_PORT !== 587),
        auth: {
          user: env.SMTP_USER,
          pass: env.SMTP_PASS,
        },
        connectionTimeout: 7000,
        greetingTimeout: 7000,
        socketTimeout: 10000,
      });
      logger.info(`SMTP Transporter initialized for host: ${env.SMTP_HOST}`);
      return this.transporter;
    }

    return null;
  }

  /**
   * Check if outgoing SMTP server is actively configured
   */
  static hasSmtpConfigured(): boolean {
    return Boolean(env.SMTP_HOST && env.SMTP_USER && env.SMTP_PASS);
  }

  public static lastDelivery: {
    timestamp: string;
    to: string;
    delivered: boolean;
    method?: 'vercel-https-bridge' | 'direct-smtp';
    error?: string;
  } | null = null;

  /**
   * Dispatch email via Vercel HTTPS Email Bridge
   * (Essential on platforms like Render Free Tier that block outbound ports 25, 465, and 587)
   */
  private static async sendViaVercelBridge(options: SendEmailOptions): Promise<{ delivered: boolean; error?: string }> {
    const bridgeUrl = `${env.FRONTEND_URL}/api/auth/send-reset-email`;
    try {
      logger.info(`Dispatching email via Vercel HTTPS Bridge to ${options.to} (${bridgeUrl})`);

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 12000);

      const response = await fetch(bridgeUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-orderpulse-secret': 'storepulse-super-secret-jwt-key-2026',
        },
        body: JSON.stringify({
          to: options.to,
          subject: options.subject,
          text: options.text || options.subject,
          html: options.html,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      const data = await response.json().catch(() => ({}));
      if (response.ok && (data as any).success) {
        logger.info(`Email successfully dispatched via Vercel Bridge to ${options.to}`, {
          messageId: (data as any).messageId,
        });
        return { delivered: true };
      }

      const errDetail = (data as any)?.error || `HTTP ${response.status} from Vercel Bridge`;
      logger.error(`Vercel Bridge responded with error: ${errDetail}`);
      return { delivered: false, error: errDetail };
    } catch (err: any) {
      const errMsg = err?.message || String(err);
      logger.error(`Failed to reach Vercel Bridge (${bridgeUrl}): ${errMsg}`);
      return { delivered: false, error: errMsg };
    }
  }

  /**
   * Dispatch a generic email, falling back cleanly to logger in dev/test environments
   */
  static async sendEmail(options: SendEmailOptions): Promise<{ delivered: boolean; devPreview?: string }> {
    // 1. If deployed to production or FRONTEND_URL points to Vercel, use Vercel HTTPS Bridge
    // This cleanly bypasses Render's free tier egress firewall that silently drops raw SMTP packets!
    if (env.FRONTEND_URL && env.FRONTEND_URL.includes('vercel.app')) {
      const bridgeResult = await this.sendViaVercelBridge(options);
      this.lastDelivery = {
        timestamp: new Date().toISOString(),
        to: options.to,
        delivered: bridgeResult.delivered,
        method: 'vercel-https-bridge',
        error: bridgeResult.delivered ? undefined : bridgeResult.error,
      };

      if (bridgeResult.delivered) {
        return { delivered: true };
      }

      logger.warn(`Vercel bridge delivery failed: ${bridgeResult.error}. Direct SMTP is blocked on Render free tier.`);
      return { delivered: false, devPreview: bridgeResult.error };
    }

    const transporter = this.getTransporter();

    if (transporter) {
      try {
        const info = await transporter.sendMail({
          from: env.SMTP_FROM,
          to: options.to,
          subject: options.subject,
          text: options.text || options.subject,
          html: options.html,
        });

        logger.info(`Email successfully dispatched to ${options.to}`, {
          messageId: info.messageId,
          subject: options.subject,
        });

        this.lastDelivery = {
          timestamp: new Date().toISOString(),
          to: options.to,
          delivered: true,
          method: 'direct-smtp',
        };

        return { delivered: true };
      } catch (error) {
        const errMsg = error instanceof Error ? error.message : String(error);
        logger.error(`Failed to dispatch email to ${options.to}:`, {
          error: errMsg,
        });

        this.lastDelivery = {
          timestamp: new Date().toISOString(),
          to: options.to,
          delivered: false,
          method: 'direct-smtp',
          error: errMsg,
        };

        return { delivered: false };
      }
    }

    this.lastDelivery = {
      timestamp: new Date().toISOString(),
      to: options.to,
      delivered: false,
      error: 'SMTP not configured on this server (env.SMTP_HOST / USER / PASS missing)',
    };

    // Dev/Sandbox fallback: log to console with clear formatting
    logger.info('================================================================');
    logger.info(`[SIMULATED EMAIL DISPATCH - NO SMTP CONFIGURED]`);
    logger.info(`To: ${options.to}`);
    logger.info(`Subject: ${options.subject}`);
    logger.info('================================================================');

    return { delivered: false, devPreview: 'SMTP not configured; check server logs' };
  }

  /**
   * Send a branded, responsive Password Reset Email
   */
  static async sendPasswordResetEmail(
    toEmail: string,
    userName: string,
    resetUrl: string
  ): Promise<{ delivered: boolean; resetUrl: string }> {
    const displayName = userName?.trim() || 'Valued User';

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Reset Your OrderPulse Password</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #0F172A; color: #334155; margin: 0; padding: 24px 0; }
          .container { max-width: 560px; margin: 0 auto; background: #FFFFFF; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 25px rgba(0,0,0,0.2); }
          .header { background: #0F172A; padding: 32px 24px; text-align: center; border-bottom: 3px solid #FF7A00; }
          .brand { color: #FFFFFF; font-size: 24px; font-weight: 800; letter-spacing: -0.5px; }
          .brand span { color: #FF7A00; }
          .content { padding: 36px 32px; font-size: 15px; line-height: 1.6; color: #334155; }
          .btn-container { text-align: center; margin: 32px 0; }
          .btn { background: #FF7A00; color: #FFFFFF !important; font-weight: 700; font-size: 16px; padding: 14px 32px; text-decoration: none; border-radius: 10px; display: inline-block; box-shadow: 0 4px 14px rgba(255, 122, 0, 0.35); }
          .callout { background: #FFF7ED; border-left: 4px solid #FF7A00; padding: 12px 16px; border-radius: 6px; font-size: 14px; color: #9A3412; margin: 24px 0; }
          .footer { background: #F8FAFC; padding: 24px; text-align: center; font-size: 12px; color: #94A3B8; border-top: 1px solid #E2E8F0; }
          .break-link { word-break: break-all; color: #FF7A00; font-size: 13px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="brand">ORDER<span>PULSE</span></div>
            <div style="color: #94A3B8; font-size: 13px; margin-top: 4px;">Restaurant POS & Kitchen Display Platform</div>
          </div>
          <div class="content">
            <h2 style="margin-top: 0; color: #0F172A; font-size: 20px;">Password Reset Request</h2>
            <p>Hello <strong>${displayName}</strong>,</p>
            <p>We received a request to reset the password for your OrderPulse account associated with <strong>${toEmail}</strong>.</p>
            <p>Click the button below to choose a new password:</p>
            
            <div class="btn-container">
              <a href="${resetUrl}" class="btn" target="_blank">Reset Password</a>
            </div>

            <div class="callout">
              <strong>Security Notice:</strong> This link will expire in <strong>15 minutes</strong> and can only be used once. If you did not request a password reset, please ignore this email or contact your store administrator.
            </div>

            <p style="font-size: 13px; color: #64748B;">
              If the button doesn't work, copy and paste this link into your browser:<br>
              <a href="${resetUrl}" class="break-link">${resetUrl}</a>
            </p>
          </div>
          <div class="footer">
            &copy; ${new Date().getFullYear()} OrderPulse Systems Inc. All rights reserved.<br>
            Secure Multi-Tenant Cloud Point of Sale
          </div>
        </div>
      </body>
      </html>
    `;

    const text = `
Hello ${displayName},

We received a request to reset the password for your OrderPulse account (${toEmail}).

Reset your password by opening the link below in your browser:
${resetUrl}

This link is valid for 15 minutes and can only be used once.
If you did not request this, you can safely ignore this email.

- The OrderPulse Team
    `.trim();

    logger.info(`[PASSWORD RESET LINK GENERATED] for ${toEmail}: ${resetUrl}`);

    await this.sendEmail({
      to: toEmail,
      subject: 'Reset Your OrderPulse Password',
      html,
      text,
    });

    return { delivered: Boolean(this.getTransporter()), resetUrl };
  }
}
