import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { CYCLE_SECONDS, TIERS } from '@/lib/constants'
import type { TierKey } from '@/lib/constants'
import type { Database } from '@/lib/supabase/database.types'

type Profile = Database['public']['Tables']['profiles']['Row']

export async function POST(request: Request) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Fetch latest profile
    const { data: profile, error: fetchError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    if (fetchError || !profile) {
      return NextResponse.json(
        { error: 'Profile not found' },
        { status: 404 }
      )
    }

    const userProfile = profile as Profile

    if (!userProfile.mining_start) {
      return NextResponse.json(
        { error: 'Mining not active' },
        { status: 400 }
      )
    }

    // Robust date parsing
    const miningStartDate = new Date(userProfile.mining_start)
    if (isNaN(miningStartDate.getTime())) {
      return NextResponse.json(
        { error: 'Invalid mining start timestamp' },
        { status: 400 }
      )
    }

    const elapsedSec = Math.floor(
      (Date.now() - miningStartDate.getTime()) / 1000
    )

    const totalSec = Number(userProfile.time_remaining ?? CYCLE_SECONDS)

    if (isNaN(totalSec) || totalSec <= 0) {
      return NextResponse.json(
        { error: 'Invalid cycle duration' },
        { status: 400 }
      )
    }

    const remainingSec = totalSec - elapsedSec

    if (remainingSec > 0) {
      return NextResponse.json(
        {
          error: `Cycle not complete yet. ${Math.ceil(remainingSec)}s remaining.`,
        },
        { status: 400 }
      )
    }

    const tier = userProfile.tier as TierKey

    const tierConfig = TIERS[tier]
    if (!tierConfig?.rate) {
      return NextResponse.json(
        { error: 'Invalid tier configuration' },
        { status: 400 }
      )
    }

    const reward = tierConfig.rate
    const currentBalance = Number(userProfile.balance ?? 0)
    const newBalance = currentBalance + reward

    const updateData = {
      balance: newBalance,
      mining_start: null,
      time_remaining: null,
    }

    // Final update - could be improved with a DB function / transaction for atomicity
    const { error: updateError } = await (supabase as any)
      .from('profiles')
      .update(updateData)
      .eq('id', user.id)
      // Optional: add a safety check if you want extra protection against concurrent claims
      // .eq('mining_start', userProfile.mining_start) // but timestamps can be tricky

    if (updateError) {
      console.error('Update error:', updateError) // For server logs
      return NextResponse.json(
        { error: 'Failed to claim reward' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      reward,
      newBalance,
    })
  } catch (err) {
    console.error('Claim reward error:', err)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}