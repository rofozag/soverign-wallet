import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import type { Database } from '@/lib/supabase/database.types'

type Profile = Database['public']['Tables']['profiles']['Row']

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
    return NextResponse.json({ error: 'Mining is already running' }, { status: 400 })
  }

  if (!profile.time_remaining || profile.time_remaining <= 0) {
    return NextResponse.json({ error: 'No paused session to resume' }, { status: 400 })
  }

  // Set mining_start to NOW. time_remaining holds the seconds that were
  // left when paused — MiningTimer calculates:
  //   current = time_remaining - elapsed_since_mining_start
  const now = new Date().toISOString()

  const { error: updateError } = await (supabase as any)
    .from('profiles')
    .update({ mining_start: now })
    .eq('id', user.id)

  if (updateError) {
    return NextResponse.json({ error: 'Failed to resume mining' }, { status: 500 })
  }

  return NextResponse.json({ success: true, mining_start: now })
}
