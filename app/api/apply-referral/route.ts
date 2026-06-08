import { createClient as createServiceClient } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { REFERRAL_BONUS } from '@/lib/constants'

export async function POST(req: NextRequest) {
  const supabase = createClient()

  // Who is signing up right now
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: { referral_code?: unknown }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  const code = body.referral_code
  if (!code || typeof code !== 'string' || !code.trim()) {
    return NextResponse.json({ error: 'Referral code is required' }, { status: 400 })
  }

  const service = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  // Find the referrer by their referral_code
  const { data: referrer, error: findError } = await service
    .from('profiles')
    .select('id, balance, referral_code')
    .eq('referral_code', code.trim().toUpperCase())
    .single()

  if (findError || !referrer) {
    return NextResponse.json({ error: 'Invalid referral code' }, { status: 400 })
  }

  // Can't refer yourself
  if (referrer.id === user.id) {
    return NextResponse.json({ error: 'You cannot use your own referral code' }, { status: 400 })
  }

  // Check this user hasn't already been referred
  const { data: currentProfile } = await service
    .from('profiles')
    .select('referred_by')
    .eq('id', user.id)
    .single()

  if (currentProfile?.referred_by) {
    return NextResponse.json({ error: 'Referral code already applied' }, { status: 400 })
  }

  // ── Credit the referrer ──────────────────────────────────────
  const newBalance = Number(referrer.balance) + REFERRAL_BONUS

  const { error: creditError } = await service
    .from('profiles')
    .update({ balance: newBalance })
    .eq('id', referrer.id)

  if (creditError) {
    return NextResponse.json({ error: 'Failed to credit referral bonus' }, { status: 500 })
  }

  // ── Mark the new user as referred ───────────────────────────
  await service
    .from('profiles')
    .update({ referred_by: referrer.id })
    .eq('id', user.id)

  return NextResponse.json({
    success: true,
    message: `Referral applied! ₦${REFERRAL_BONUS.toLocaleString()} credited to your friend.`,
  })
}
