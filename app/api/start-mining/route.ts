import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { CYCLE_SECONDS } from '@/lib/constants'
import type { Database } from '@/lib/supabase/database.types'

export async function POST() {
  const supabase = createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile, error: fetchError } = await (supabase as any)
    .from('profiles')
    .select('mining_start, time_remaining')
    .eq('id', user.id)
    .single()

  if (fetchError || !profile) {
    return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
  }

  if (profile.mining_start) {
    return NextResponse.json({ error: 'Mining already active' }, { status: 400 })
  }

  const now = new Date().toISOString()

  const { error: updateError } = await (supabase as any)
    .from('profiles')
    .update({
      mining_start:   now,
      time_remaining: CYCLE_SECONDS,  // Fresh cycle = full 5400 seconds
    })
    .eq('id', user.id)

  if (updateError) {
    return NextResponse.json({ error: 'Failed to start mining' }, { status: 500 })
  }

  return NextResponse.json({ success: true, mining_start: now })
}
