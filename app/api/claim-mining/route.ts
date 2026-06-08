import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { CYCLE_SECONDS, TIERS } from '@/lib/constants'
import type { TierKey } from '@/lib/constants'

export async function POST() {
  const supabase = createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile, error: fetchError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (fetchError || !profile) {
    return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
  }

  if (!profile.mining_start) {
    return NextResponse.json({ error: 'Mining not active' }, { status: 400 })
  }

  // Validate that the cycle is complete.
  // time_remaining holds the TOTAL seconds this cycle was initialised with
  // (CYCLE_SECONDS on a fresh start, or a smaller value on resume).
  // Elapsed is computed against the DB mining_start timestamp.
  const elapsedSec  = Math.floor(
    (Date.now() - new Date(profile.mining_start).getTime()) / 1000
  )
  const totalSec    = profile.time_remaining ?? CYCLE_SECONDS
  const remainingSec = totalSec - elapsedSec

  if (remainingSec > 0) {
    return NextResponse.json(
      { error: `Cycle not complete yet. ${Math.ceil(remainingSec)}s remaining.` },
      { status: 400 }
    )
  }

  const tier       = profile.tier as TierKey
  const reward     = TIERS[tier].rate
  const newBalance = Number(profile.balance) + reward

  const { error: updateError } = await supabase
    .from('profiles')
    .update({
      balance:        newBalance,
      mining_start:   null,
      time_remaining: null,    // Reset — ready for a fresh cycle
    })
    .eq('id', user.id)

  if (updateError) {
    return NextResponse.json({ error: 'Failed to claim reward' }, { status: 500 })
  }

  return NextResponse.json({ success: true, reward, newBalance })
}
