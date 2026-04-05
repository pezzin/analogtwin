import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  const { password } = await req.json()

  if (!process.env.APP_PASSWORD || password !== process.env.APP_PASSWORD) {
    return NextResponse.json({ error: 'Password errata' }, { status: 401 })
  }

  const res = NextResponse.json({ ok: true })
  res.cookies.set('at_session', 'authenticated', {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 60 * 60 * 24 * 7, // 7 days
    path: '/',
  })
  return res
}
