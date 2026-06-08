'use client'

import { useState, useCallback } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useStore } from '@/lib/store'
import { CYCLE_SECONDS, TIERS } from '@/lib/constants'

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  return `${m}:${s.toString().padStart(2, '0')}`
}

export default function MiningEngine() {
  const queryClient = useQueryClient()

  const {
    profile,
    timerSeconds,
    timerPaused,
    updateBalance,
    updateMiningStart,
    updateTimeRemaining,
    setTimerSeconds,
    setTimerPaused,
  } = useStore()

  const [starting,  setStarting]  = useState(false)
  const [resuming,  setResuming]  = useState(false)
  const [claiming,  setClaiming]  = useState(false)
  const [error,     setError]     = useState('')

  if (!profile) return null

  const tierData  = TIERS[profile.tier]

  // Derived state
  const isIdle     = !profile.mining_start && (profile.time_remaining === null || profile.time_remaining === 0)
  const isRunning  = !!profile.mining_start && !timerPaused
  const isPaused   = timerPaused && timerSeconds !== null && timerSeconds > 0
  const canClaim   = (timerSeconds !== null && timerSeconds <= 0) && !!profile.mining_start

  // Progress 0→1 as cycle fills up
  const totalSeconds = profile.time_remaining ?? CYCLE_SECONDS
  const progress = timerSeconds !== null
    ? Math.min(1, Math.max(0, 1 - timerSeconds / totalSeconds))
    : 0

  const R    = 52
  const CIRC = 2 * Math.PI * R
  const dashOffset = CIRC * (1 - progress)

  // ── Start fresh cycle ───────────────────────────────────────
  const handleStart = useCallback(async () => {
    setError('')
    setStarting(true)
    try {
      const res  = await fetch('/api/start-mining', { method: 'POST' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to start mining')

      updateMiningStart(data.mining_start)
      updateTimeRemaining(CYCLE_SECONDS)
      // MiningTimer effect will detect mining_start change and start interval
    } catch (err: any) {
      setError(err.message)
    } finally {
      setStarting(false)
    }
  }, [updateMiningStart, updateTimeRemaining])

  // ── Resume from pause ───────────────────────────────────────
  const handleResume = useCallback(async () => {
    setError('')
    setResuming(true)
    try {
      const res  = await fetch('/api/resume-mining', { method: 'POST' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to resume mining')

      // Update Zustand — MiningTimer will detect mining_start change
      // and restart the interval from the saved time_remaining
      updateMiningStart(data.mining_start)
      setTimerPaused(false)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setResuming(false)
    }
  }, [updateMiningStart, setTimerPaused])

  // ── Claim reward ────────────────────────────────────────────
  const handleClaim = useCallback(async () => {
    setError('')
    setClaiming(true)
    try {
      const res  = await fetch('/api/claim-mining', { method: 'POST' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to claim reward')

      updateBalance(data.newBalance)
      updateMiningStart(null)
      updateTimeRemaining(null)
      setTimerSeconds(null)
      queryClient.invalidateQueries({ queryKey: ['profile'] })
    } catch (err: any) {
      setError(err.message)
    } finally {
      setClaiming(false)
    }
  }, [updateBalance, updateMiningStart, updateTimeRemaining, setTimerSeconds, queryClient])

  return (
    <div className="card">
      <div className="text-center mb-5">
        <h2 className="text-xl font-display font-bold mb-1">Mining Engine</h2>
        <p className="text-sm text-white/50">
          Earn ₦{tierData.rate.toLocaleString()} every 90 minutes
        </p>
      </div>

      {/* ── Ring ───────────────────────────────────────────────── */}
      <div className="relative w-32 h-32 mx-auto mb-6">
        {/* Background circle */}
        <div className="absolute inset-0 rounded-full bg-void border-2 border-edge" />

        {/* Progress ring */}
        {(isRunning || canClaim) && (
          <svg
            className="absolute inset-0 w-full h-full -rotate-90"
            viewBox="0 0 128 128"
          >
            <circle cx="64" cy="64" r={R} fill="none"
              stroke={`rgba(245,166,35,0.12)`} strokeWidth="4" />
            <circle cx="64" cy="64" r={R} fill="none"
              stroke="#f5a623" strokeWidth="4" strokeLinecap="round"
              strokeDasharray={CIRC} strokeDashoffset={dashOffset}
              style={{ transition: 'stroke-dashoffset 0.9s ease' }} />
          </svg>
        )}

        {/* Paused ring */}
        {isPaused && (
          <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 128 128">
            <circle cx="64" cy="64" r={R} fill="none"
              stroke="rgba(148,163,184,0.15)" strokeWidth="4" />
            <circle cx="64" cy="64" r={R} fill="none"
              stroke="#94a3b8" strokeWidth="4" strokeLinecap="round"

              strokeDashoffset={`${CIRC * (timerSeconds! / totalSeconds)}`}
            />
          </svg>
        )}

        {/* Claimable glow */}
        {canClaim && (
          <div className="absolute inset-0 rounded-full bg-green-500/20 animate-glow" />
        )}

        {/* Inner content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          {isIdle && (
            <span className="text-4xl select-none">⛏️</span>
          )}
          {isRunning && timerSeconds !== null && timerSeconds > 0 && (
            <>
              <span className="text-lg font-display font-bold text-gold leading-none">
                {formatTime(timerSeconds)}
              </span>
              <span className="text-[10px] text-white/40 mt-1">remaining</span>
            </>
          )}
          {canClaim && (
            <>
              <span className="text-sm font-display font-bold text-green-400 leading-none">
                Ready!
              </span>
              <span className="text-[10px] text-white/40 mt-1">claim now</span>
            </>
          )}
          {isPaused && timerSeconds !== null && (
            <>
              <span className="text-lg font-display font-bold text-silver leading-none">
                {formatTime(timerSeconds)}
              </span>
              <span className="text-[10px] text-white/40 mt-1">paused</span>
            </>
          )}
        </div>
      </div>

      {/* ── Error ──────────────────────────────────────────────── */}
      {error && (
        <div className="text-sm text-red-400 bg-red-400/10 border border-red-400/20 rounded-lg px-4 py-3 mb-4">
          {error}
        </div>
      )}

      {/* ── Action button ───────────────────────────────────────── */}
      {isIdle && (
        <button onClick={handleStart} disabled={starting}
          className="w-full py-3 rounded-xl font-display font-semibold bg-gold text-void hover:bg-gold/90 disabled:opacity-40 disabled:cursor-not-allowed transition-all">
          {starting ? 'Starting...' : 'Start Mining'}
        </button>
      )}

      {isRunning && !canClaim && (
        <button disabled
          className="w-full py-3 rounded-xl font-display font-semibold bg-void border border-edge cursor-not-allowed opacity-40">
          Mining in Progress...
        </button>
      )}

      {isPaused && (
        <button onClick={handleResume} disabled={resuming}
          className="w-full py-3 rounded-xl font-display font-semibold bg-silver/20 border border-silver/40 text-silver hover:bg-silver/30 disabled:opacity-40 disabled:cursor-not-allowed transition-all">
          {resuming ? 'Resuming...' : `Continue Mining · ${formatTime(timerSeconds!)}`}
        </button>
      )}

      {canClaim && (
        <button onClick={handleClaim} disabled={claiming}
          className="w-full py-3 rounded-xl font-display font-semibold bg-green-600 hover:bg-green-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all">
          {claiming ? 'Claiming...' : `Claim ₦${tierData.rate.toLocaleString()}`}
        </button>
      )}

      {/* ── Footer stats ────────────────────────────────────────── */}
      {(isRunning || isPaused) && (
        <div className="mt-4 pt-4 border-t border-edge grid grid-cols-2 gap-4 text-center text-sm">
          <div>
            <p className="text-white/40 mb-0.5 text-xs">This Cycle</p>
            <p className="font-display text-gold">₦{tierData.rate.toLocaleString()}</p>
          </div>
          <div>
            <p className="text-white/40 mb-0.5 text-xs">Max / Day</p>
            <p className="font-display">₦{(tierData.rate * 16).toLocaleString()}</p>
          </div>
        </div>
      )}
    </div>
  )
}
