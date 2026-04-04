import { NextResponse } from 'next/server'

export async function GET() {
  const configured = !!(
    process.env.SMTP_HOST &&
    process.env.SMTP_USER &&
    process.env.SMTP_PASS
  )
  return NextResponse.json({
    configured,
    host: configured ? process.env.SMTP_HOST : null,
    from: configured ? process.env.SMTP_FROM : null,
  })
}
