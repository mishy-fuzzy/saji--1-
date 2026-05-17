import { NextResponse } from 'next/server'
import { registerAlby } from '@/lib/server/alby-clients'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { userId, albyPubKey, clientId } = body || {}
    if (!userId && !albyPubKey && !clientId) {
      return NextResponse.json({ ok: false, error: 'userId_or_albyPubKey_or_clientId_required' }, { status: 400 })
    }

    const res = registerAlby({ userId, albyPubKey, clientId })
    return NextResponse.json({ ok: true, key: res.key })
  } catch (err: any) {
    console.error('alby_register_error', err)
    return NextResponse.json({ ok: false, error: String(err?.message || err) }, { status: 500 })
  }
}
