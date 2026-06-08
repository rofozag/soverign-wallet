import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { MIN_WITHDRAW } from '@/lib/constants'

export async function POST(req: NextRequest) {
  const supabase = createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: { acct_number?: unknown; bank_name?: unknown; acct_holder?: unknown }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const { acct_number, bank_name, acct_holder } = body

  if (
    !acct_number || typeof acct_number !== 'string' ||
    !bank_name   || typeof bank_name   !== 'string' ||
    !acct_holder || typeof acct_holder !== 'string'
  ) {
    return NextResponse.json({ error: 'Missing or invalid fields' }, { status: 400 })
  }

  const { data: profile, error: fetchError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (fetchError || !profile) {
    return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
  }

  // All three gates — ordered from cheapest to most expensive check
  if (profile.tier === 'basic') {
    return NextResponse.json({ error: 'Basic tier cannot withdraw. Upgrade your miner first.' }, { status: 403 })
  }

  if (!profile.withdrawal_code_verified) {
    return NextResponse.json({ error: 'Withdrawal not unlocked. Purchase a withdrawal code first.' }, { status: 403 })
  }

  if (Number(profile.balance) < MIN_WITHDRAW) {
    return NextResponse.json(
      { error: `Insufficient balance. Need ₦${MIN_WITHDRAW.toLocaleString()}.` },
      { status: 400 }
    )
  }

  const { error: insertError } = await supabase
    .from('withdrawals')
    .insert({
      user_id:    user.id,
      amount:     MIN_WITHDRAW,
      acct_number: acct_number.trim(),
      bank_name:   bank_name.trim(),
      acct_holder: acct_holder.trim(),
      status:     'pending',
    })

  if (insertError) {
    return NextResponse.json({ error: 'Failed to create withdrawal request' }, { status: 500 })
  }

  const { error: updateError } = await supabase
    .from('profiles')
    .update({ balance: Number(profile.balance) - MIN_WITHDRAW })
    .eq('id', user.id)

  if (updateError) {
    // Withdrawal row created but balance not deducted — log for manual fix
    console.error('BALANCE_DEDUCT_FAILED', { userId: user.id })
    return NextResponse.json({ error: 'Balance update failed. Contact support.' }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
