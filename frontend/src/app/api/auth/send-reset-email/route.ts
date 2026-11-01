import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

export const dynamic = 'force-dynamic';

const VALID_BRIDGE_SECRETS = [
  'orderpulse-bridge-secret-key-2026',
  'storepulse-super-secret-jwt-key-2026',
  process.env.ORDERPULSE_BRIDGE_SECRET,
  process.env.JWT_SECRET,
].filter(Boolean) as string[];

function buildPasswordResetHtml(displayName: string, resetUrl: string): string {
  return `
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
        .content { padding: 40px 32px; }
        .heading { font-size: 20px; font-weight: 700; color: #0F172A; margin-top: 0; margin-bottom: 16px; }
        .text { font-size: 15px; line-height: 1.6; color: #475569; margin-bottom: 24px; }
        .button-wrap { text-align: center; margin: 36px 0; }
        .button { display: inline-block; background-color: #FF7A00; color: #FFFFFF !important; font-weight: 700; font-size: 16px; padding: 14px 36px; text-decoration: none; border-radius: 10px; box-shadow: 0 4px 12px rgba(255, 122, 0, 0.35); }
        .link-backup { background-color: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 8px; padding: 12px 16px; font-size: 13px; color: #64748B; word-break: break-all; margin-top: 24px; }
        .notice { font-size: 13px; color: #94A3B8; margin-top: 32px; padding-top: 20px; border-top: 1px solid #E2E8F0; }
        .footer { background: #F8FAFC; padding: 20px 24px; text-align: center; font-size: 12px; color: #94A3B8; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="brand">Order<span>Pulse</span></div>
        </div>
        <div class="content">
          <h1 class="heading">Password Reset Request</h1>
          <p class="text">Hello <strong>${displayName}</strong>,</p>
          <p class="text">We received a request to reset your password for your OrderPulse account. Click the button below to choose a new password:</p>
          <div class="button-wrap">
            <a href="${resetUrl}" class="button" target="_blank" rel="noopener noreferrer">Reset Password</a>
          </div>
          <p class="text" style="font-size: 14px; color: #64748B;">This link is valid for <strong>15 minutes</strong> and can only be used once.</p>
          <div class="link-backup">
            <strong>Can't click the button?</strong> Paste this link into your browser:<br>
            <a href="${resetUrl}" style="color: #FF7A00;">${resetUrl}</a>
          </div>
          <div class="notice">
            If you did not request a password reset, you can safely ignore this email. Your account remains completely secure.
          </div>
        </div>
        <div class="footer">
          &copy; ${new Date().getFullYear()} OrderPulse Inc. All rights reserved.
        </div>
      </div>
    </body>
    </html>
  `;
}

export async function GET() {
  return NextResponse.json({
    status: 'ok',
    bridge: 'OrderPulse Vercel Email Bridge',
    timestamp: new Date().toISOString(),
  });
}

export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get('x-orderpulse-secret');

    // Authenticate with any known secret token
    const isAuthorized = authHeader && VALID_BRIDGE_SECRETS.includes(authHeader);
    if (!isAuthorized) {
      console.warn(`[Vercel Bridge] Unauthorized request with header: ${authHeader?.slice(0, 8)}...`);
      return NextResponse.json({ error: 'Unauthorized bridge request' }, { status: 401 });
    }

    const body = await req.json();
    let { to, subject, html, text, name, resetUrl } = body;

    if (!to) {
      return NextResponse.json({ error: 'Missing required field: to' }, { status: 400 });
    }

    // Auto-construct branded reset email if name and resetUrl are provided
    if (resetUrl && !html) {
      subject = subject || 'Reset Your OrderPulse Password';
      html = buildPasswordResetHtml(name || 'Valued User', resetUrl);
      text = text || `Reset your OrderPulse password by clicking this link: ${resetUrl}`;
    }

    if (!subject || !html) {
      return NextResponse.json(
        { error: 'Missing required fields: subject and html are required (or provide resetUrl)' },
        { status: 400 }
      );
    }

    // Gmail SMTP credentials verified for OrderPulse
    const smtpUser = process.env.SMTP_USER || 'udaybadhe2004@gmail.com';
    const smtpPass = (process.env.SMTP_PASS || 'oswthafqhklgrfsl').replace(/\s+/g, '');

    const transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 465,
      secure: true,
      auth: {
        user: smtpUser,
        pass: smtpPass,
      },
      connectionTimeout: 12000,
      greetingTimeout: 10000,
      socketTimeout: 15000,
    });

    const info = await transporter.sendMail({
      from: process.env.SMTP_FROM || 'OrderPulse <udaybadhe2004@gmail.com>',
      to,
      subject,
      text: text || subject,
      html,
    });

    console.log(`[Vercel Bridge] Email delivered to ${to} (MessageId: ${info.messageId})`);

    return NextResponse.json({
      success: true,
      delivered: true,
      messageId: info.messageId,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('[Vercel Bridge] Email delivery failed:', error);
    return NextResponse.json(
      {
        success: false,
        delivered: false,
        error: error?.message || 'Failed to dispatch email via Vercel bridge',
      },
      { status: 500 }
    );
  }
}
