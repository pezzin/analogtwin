import nodemailer from 'nodemailer'
import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  const { subject, body, recipients } = await req.json()

  if (!recipients || recipients.length === 0) {
    return NextResponse.json({ error: 'No recipients configured' }, { status: 400 })
  }

  const host = process.env.SMTP_HOST
  const user = process.env.SMTP_USER
  const pass = process.env.SMTP_PASS

  if (!host || !user || !pass) {
    return NextResponse.json({ error: 'SMTP not configured' }, { status: 500 })
  }

  const transporter = nodemailer.createTransport({
    host,
    port: parseInt(process.env.SMTP_PORT ?? '587'),
    secure: process.env.SMTP_SECURE === 'true',
    auth: { user, pass },
  })

  await transporter.sendMail({
    from: process.env.SMTP_FROM ?? user,
    to: recipients.join(', '),
    subject,
    html: body,
  })

  return NextResponse.json({ ok: true })
}
