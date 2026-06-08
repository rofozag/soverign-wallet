import { createClient as createServiceClient } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const supabase = createClient()

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

  const service = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  // Verify code exists
  const { data: wdCode, error: lookupError } = await service
    .from('withdrawal_codes')
    .select('id')
    .eq('code', code.trim().toUpperCase())
    .single()

  if (lookupError || !wdCode) {
    return NextResponse.json({ error: 'Invalid withdrawal code' }, { status: 400 })
  }

  // Update with service role — no RLS blocking
  const { error: updateError } = await service
    .from('profiles')
    .update({ withdrawal_code_verified: true })
    .eq('id', user.id)

  if (updateError) {
    console.error('[verify-withdrawal-code] update failed:', updateError)
    return NextResponse.json({ error: 'Failed to unlock withdrawals' }, { status: 500 })
  }

  // Return the full updated profile so client can sync in one shot
  const { data: updatedProfile } = await service
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  return NextResponse.json({
    success: true,
    profile: updatedProfile ?? null,
  })
}
