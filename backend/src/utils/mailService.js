import nodemailer from 'nodemailer';
import { env } from '../config/env.js';

function isMailConfigured() {
  return Boolean(env.mail.host && env.mail.from);
}

function createTransport() {
  return nodemailer.createTransport({
    auth:
      env.mail.user || env.mail.password
        ? {
            pass: env.mail.password,
            user: env.mail.user,
          }
        : undefined,
    host: env.mail.host,
    port: env.mail.port,
    secure: env.mail.secure,
  });
}

export async function sendTenantCredentialsEmail({
  password,
  tenantEmail,
  tenantName,
  username,
}) {
  if (!isMailConfigured()) {
    console.warn(
      `SMTP is not configured. Tenant credentials for ${tenantEmail} were not emailed.`,
    );
    return { error: '', sent: false, skipped: true };
  }

  try {
    const transporter = createTransport();

    await transporter.sendMail({
      from: env.mail.from,
      subject: 'Thong tin tai khoan Smart Rental',
      text: [
        `Xin chao ${tenantName},`,
        '',
        'Tai khoan Smart Rental cua ban da duoc tao.',
        `Ten dang nhap: ${username}`,
        `Mat khau: ${password}`,
        '',
        'Vui long dang nhap va bao mat thong tin tai khoan cua ban.',
      ].join('\n'),
      to: tenantEmail,
    });

    return { error: '', sent: true, skipped: false };
  } catch (error) {
    console.error('Tenant credential email failed:', error.message);
    return { error: error.message, sent: false, skipped: false };
  }
}
