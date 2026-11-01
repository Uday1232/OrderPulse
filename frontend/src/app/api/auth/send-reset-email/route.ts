import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

export const dynamic = 'force-dynamic';

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
    const expectedSecret = process.env.ORDERPULSE_BRIDGE_SECRET || 'storepulse-super-secret-jwt-key-2026';

    if (authHeader !== expectedSecret) {
      return NextResponse.json({ error: 'Unauthorized bridge request' }, { status: 401 });
    }

    const body = await req.json();
    const { to, subject, html, text } = body;

    if (!to || !subject || !html) {
      return NextResponse.json(
        { error: 'Missing required fields: to, subject, and html are required' },
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
