import { createClient as createServiceClient } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const supabase = createClient()

  // Verify the user is authenticated
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: { code?: unknown }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  const code = body.code
  if (!code || typeof code !== 'string' || !code.trim()) {
    return NextResponse.json({ error: 'Code is required' }, { status: 400 })
  }

  // Service role bypasses RLS entirely — no session issues, no silent 0-row updates
  const service = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  // Look up the activation code
  const { data: activation, error: lookupError } = await service
    .from('activation_codes')
    .select('tier')
    .eq('code', code.trim().toUpperCase())
    .single()

  if (lookupError || !activation) {
    return NextResponse.json({ error: 'Invalid activation code' }, { status: 400 })
  }

  // Perform the update with service role — guaranteed to hit the row
  const { error: updateError } = await service
    .from('profiles')
    .update({ tier: activation.tier })
    .eq('id', user.id)

  if (updateError) {
    console.error('[activate-tier] update failed:', updateError)
    return NextResponse.json({ error: 'Failed to activate tier' }, { status: 500 })
  }

  // Read back the full updated profile so the client can sync state exactly
  const { data: updatedProfile, error: readError } = await service
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (readError || !updatedProfile) {
    // Update succeeded — return minimal success so client can still refetch
    return NextResponse.json({ success: true, tier: activation.tier, profile: null })
  }

  return NextResponse.json({
    success: true,
    tier: activation.tier,
    profile: updatedProfile,   // Full profile returned so client sets state in one shot
  })
}
