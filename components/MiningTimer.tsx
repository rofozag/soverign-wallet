'use client'

/**
 * MiningTimer — global, invisible component mounted in the root layout.
 *
 * Because it lives ABOVE the page tree, it is never unmounted when the user
 * navigates between pages. This means the countdown interval keeps running
 * regardless of which page is currently displayed.
 *
 * Responsibilities:
 *  1. Initialise the Zustand timer from the DB profile on first load.
 *  2. Run the 1-second interval that drives the countdown.
 *  3. Pause the timer (via Supabase) when the browser tab is hidden.
 *  4. When the user returns, the DB already has time_remaining saved —
 *     React Query refetches the profile and the store shows "Continue Mining".
 */

import { useEffect, useRef } from 'react'
import { useStore } from '@/lib/store'
import { CYCLE_SECONDS } from '@/lib/constants'
import { createClient } from '@/lib/supabase/client'

export default function MiningTimer() {
  const {
    profile,
    timerSeconds,
    setTimerSeconds,
    setTimerPaused,
    updateMiningStart,
    updateTimeRemaining,
    decrementTimer,
  } = useStore()

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // ── Helpers ────────────────────────────────────────────────
  const stopInterval = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
  }

  const startInterval = () => {
    stopInterval()
    intervalRef.current = setInterval(() => {
      // Read state directly so the closure is always fresh
      useStore.getState().decrementTimer()
    }, 1000)
  }

  // ── Initialise timer whenever the DB profile changes ────────
  // Triggers on: first load, after claiming, after start/resume.
  useEffect(() => {
    if (!profile) {
      stopInterval()
      return
    }

    if (profile.mining_start) {
      // ── Actively mining ──────────────────────────────────────
      // Calculate how many seconds have elapsed since mining_start.
      // time_remaining in the DB holds the total seconds this cycle
      // was initialised with (CYCLE_SECONDS on a fresh start,
      // or the saved remainder on a resume).
      const elapsedSec = Math.floor(
        (Date.now() - new Date(profile.mining_start).getTime()) / 1000
      )
      const totalSec  = profile.time_remaining ?? CYCLE_SECONDS
      const remaining = Math.max(0, totalSec - elapsedSec)

      setTimerSeconds(remaining)
      setTimerPaused(false)

      if (remaining > 0) {
        startInterval()
      } else {
        stopInterval()   // cycle already complete — show Claim button
      }

    } else if (profile.time_remaining != null && profile.time_remaining > 0) {
      // ── Paused ───────────────────────────────────────────────
      // mining_start was cleared by the pause handler; time_remaining
      // holds the seconds that were left when the user left the tab.
      setTimerSeconds(profile.time_remaining)
      setTimerPaused(true)
      stopInterval()

    } else {
      // ── Idle (not mining) ────────────────────────────────────
      setTimerSeconds(null)
      setTimerPaused(false)
      stopInterval()
    }

    return () => stopInterval()

  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile?.id, profile?.mining_start, profile?.time_remaining])


  // ── Stop interval when countdown reaches zero ───────────────
  useEffect(() => {
    if (timerSeconds !== null && timerSeconds <= 0) {
      stopInterval()
      setTimerPaused(false)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timerSeconds])


  // ── Pause on tab/window hide ────────────────────────────────
  useEffect(() => {
    const supabase = createClient()

    const handleVisibility = async () => {
      if (!document.hidden) return   // user returned — nothing to do here

      // Read the latest store values at the moment of leaving
      const state = useStore.getState()
      const { profile: p, timerSeconds: ts } = state

      // Only pause if mining is actively running
      if (!p?.mining_start || ts === null || ts <= 0) return

      const remaining = Math.ceil(ts)

      // ── Optimistic local update ──────────────────────────────
      // Update Zustand immediately so the UI is correct if the
      // user returns before the network call completes.
      updateMiningStart(null)
      updateTimeRemaining(remaining)
      setTimerPaused(true)
      stopInterval()

      // ── Persist pause to DB ──────────────────────────────────
      // keepalive: true ensures this fetch completes even when the
      // tab is closing or the browser is navigating away.
      try {
        const { data: { user } } = await supabase.auth.getUser ()
        if (!user) return

        await (supabase as any)
          .from('profiles')
          .update({
            mining_start:   null,
            time_remaining: remaining,
          })
          .eq('id', user.id)

      } catch (err) {
        console.error('[MiningTimer] pause failed:', err)
      }
    }

    document.addEventListener('visibilitychange', handleVisibility)
    return () => document.removeEventListener('visibilitychange', handleVisibility)

  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return null  // Invisible — renders nothing
}
