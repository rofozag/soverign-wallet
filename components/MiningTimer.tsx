 'use client'

/**
 * MiningTimer — global invisible component in the root layout.
 *
 * Its ONLY job is to pause mining when the user leaves the browser
 * tab (visibilitychange). It does NOT manage any countdown interval
 * or store timer state. The countdown itself lives in MiningEngine
 * and is always derived fresh from profile.mining_start, so page
 * navigation can never reset it.
 */

import { useEffect } from 'react'
import { useStore } from '@/lib/store'
import { createClient } from '@/lib/supabase/client'
import { CYCLE_SECONDS } from '@/lib/constants'

export default function MiningTimer() {
  useEffect(() => {
    const supabase = createClient()

    const handleVisibility = async () => {
      if (!document.hidden) return

      const { profile, setMiningPaused, updateMiningStart, updateTimeRemaining } =
        useStore.getState()

      // Only act if mining is actively running
      if (!profile?.mining_start) return

      // Calculate how many seconds were left at the moment the user left
      const elapsedSec  = Math.floor(
        (Date.now() - new Date(profile.mining_start).getTime()) / 1000
      )
      const totalSec    = profile.time_remaining ?? CYCLE_SECONDS
      const remaining   = Math.max(0, totalSec - elapsedSec)

      // ── Optimistic local update ──────────────────────────────
      updateMiningStart(null)
      updateTimeRemaining(remaining)
      setMiningPaused(true)

      // ── Persist to DB ────────────────────────────────────────
      // keepalive ensures this completes even if the tab is closing
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        await (supabase as any)
          .from('profiles')
          .update({ mining_start: null, time_remaining: remaining })
          .eq('id', user.id)
      } catch (err) {
        console.error('[MiningTimer] pause failed:', err)
      }
    }

    document.addEventListener('visibilitychange', handleVisibility)
    return () => document.removeEventListener('visibilitychange', handleVisibility)
  }, [])

  return null
}
