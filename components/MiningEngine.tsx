'use client'

import { useState, useEffect, useCallback } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useStore } from '@/lib/store'
import { CYCLE_SECONDS, TIERS } from '@/lib/constants'

// ── Pure helper — always correct regardless of when it's called ─
// Remaining seconds = total seconds this cycle started with
//                   - seconds elapsed since mining_start was set
function calcRemaining(
  miningStart: string | null,
  timeRemaining: number | null
): number | null {
  if (!miningStart) return null
  const elapsed = Math.floor(
    (Date.now() - new Date(miningStart).getTime()) / 1000
  )
  return Math.max(0, (timeRemaining ?? CYCLE_SECONDS) - elapsed)
}

function fmt(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  return `${m}:${s.toString().padStart(2, '0')}`
}

export default function MiningEngine() {
  const queryClient = useQueryClient()
  const {
    profile,
    miningPaused,
    setMiningPaused,
    updateBalance,
    updateMiningStart,
    updateTimeRemaining,
  } = useStore()

  // ── Local tick — forces a re-render every second ─────────────
  // Using Date.now() means the displayed value is ALWAYS derived
  // fresh from mining_start. Navigating away and back just causes
  // a remount; on mount calcRemaining() immediately returns the
  // correct value — no flash, no reset.
  const [, setTick] = useState(0)

  useEffect(() => {
    if (!profile?.mining_start) return

    const id = setInterval(() => setTick((t) => t + 1), 1000)
    return () => clearInterval(id)
  }, [profile?.mining_start])

  const [starting, setStarting] = useState(false)
  const [resuming, setResuming] = useState(false)
  const [claiming, setClaiming] = useState(false)
  const [error,    setError]    = useState('')

  if (!profile) return null

  const tierData  = TIERS[profile.tier]

  // ── Derived state — recalculated on every tick ───────────────
  const remaining  = calcRemaining(profile.mining_start, profile.time_remaining)
  const isIdle     = !profile.mining_start && !miningPaused &&
                     (profile.time_remaining === null || profile.time_remaining === 0)
  const isRunning  = !!profile.mining_start && !miningPaused && remaining !== null && remaining > 0
  const canClaim   = !!profile.mining_start && remaining !== null && remaining <= 0
  const isPaused   = miningPaused && !profile.mining_start &&
                     profile.time_remaining !== null && profile.time_remaining > 0

  // Progress arc 0 → 1 as the cycle fills
  const totalSec  = profile.time_remaining ?? CYCLE_SECONDS
  const progress  = remaining !== null ? Math.min(1, 1 - remaining / totalSec) : 0
  const R         = 52
  const CIRC      = 2 * Math.PI * R
  const dashOffset = CIRC * (1 - progress)

  // ── Handlers ─────────────────────────────────────────────────
  const handleStart = useCallback(async () => {
    setError('')
    setStarting(true)
    try {
      const res  = await fetch('/api/start-mining', { method: 'POST' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to start mining')

      updateMiningStart(data.mining_start)
      updateTimeRemaining(CYCLE_SECONDS)
      setMiningPaused(false)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setStarting(false)
    }
  }, [updateMiningStart, updateTimeRemaining, setMiningPaused])

  const handleResume = useCallback(async () => {
    setError('')
    setResuming(true)
    try {
      const res  = await fetch('/api/resume-mining', { method: 'POST' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to resume mining')

      updateMiningStart(data.mining_start)
      setMiningPaused(false)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setResuming(false)
    }
  }, [updateMiningStart, setMiningPaused])

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
      setMiningPaused(false)
      queryClient.invalidateQueries({ queryKey: ['profile'] })
    } catch (err: any) {
      setError(err.message)
    } finally {
      setClaiming(false)
    }
  }, [updateBalance, updateMiningStart, updateTimeRemaining, setMiningPaused, queryClient])

  return (
    <div className="card">
      <div className="text-center mb-5">
        <h2 className="text-xl font-display font-bold mb-1">Mining Engine</h2>
        <p className="text-sm text-white/50">
          Earn ₦{tierData.rate.toLocaleString()} every 90 minutes
        </p>
      </div>

      {/* ── Ring ─────────────────────────────────────────────── */}
      <div className="relative w-32 h-32 mx-auto mb-6">
        <div className="absolute inset-0 rounded-full bg-void border-2 border-edge" />

        {/* Gold progress ring — shown while running or claimable */}
        {(isRunning || canClaim) && (
          <svg
            className="absolute inset-0 w-full h-full -rotate-90"
            viewBox="0 0 128 128"
          >
            <circle cx="64" cy="64" r={R} fill="none"
              stroke="rgba(245,166,35,0.12)" strokeWidth="4" />
            <circle cx="64" cy="64" r={R} fill="none"
              stroke="#f5a623" strokeWidth="4" strokeLinecap="round"
              strokeDasharray={CIRC}
              strokeDashoffset={dashOffset}
              style={{ transition: 'stroke-dashoffset 0.9s linear' }}
            />
          </svg>
        )}

        {/* Silver ring — shown while paused */}
        {isPaused && profile.time_remaining !== null && (
          <svg
            className="absolute inset-0 w-full h-full -rotate-90"
            viewBox="0 0 128 128"
          >
            <circle cx="64" cy="64" r={R} fill="none"
              stroke="rgba(148,163,184,0.12)" strokeWidth="4" />
            <circle cx="64" cy="64" r={R} fill="none"
              stroke="#94a3b8" strokeWidth="4" strokeLinecap="round"
              strokeDasharray={CIRC}
              strokeDashoffset={CIRC * (profile.time_remaining / totalSec)}
            />
          </svg>
        )}

        {/* Glow when claimable */}
        {canClaim && (
          <div className="absolute inset-0 rounded-full bg-green-500/20 animate-glow" />
        )}

        {/* Inner label */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          {isIdle && (
            <span className="text-4xl select-none">⛏️</span>
          )}
          {isRunning && remaining !== null && (
            <>
              <span className="text-lg font-display font-bold text-gold leading-none">
                {fmt(remaining)}
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
          {isPaused && profile.time_remaining !== null && (
            <>
              <span className="text-lg font-display font-bold text-silver leading-none">
                {fmt(profile.time_remaining)}
              </span>
              <span className="text-[10px] text-white/40 mt-1">paused</span>
            </>
          )}
        </div>
      </div>

      {/* ── Error ────────────────────────────────────────────── */}
      {error && (
        <div className="text-sm text-red-400 bg-red-400/10 border border-red-400/20 rounded-lg px-4 py-3 mb-4">
          {error}
        </div>
      )}

      {/* ── Buttons ──────────────────────────────────────────── */}
      {isIdle && (
        <button
          onClick={handleStart}
          disabled={starting}
          className="w-full py-3 rounded-xl font-display font-semibold bg-gold text-void hover:bg-gold/90 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
        >
          {starting ? 'Starting...' : 'Start Mining'}
        </button>
      )}

      {isRunning && (
        <button
          disabled
          className="w-full py-3 rounded-xl font-display font-semibold bg-void border border-edge cursor-not-allowed opacity-40"
        >
          Mining in Progress...
        </button>
      )}

      {isPaused && profile.time_remaining !== null && (
        <button
          onClick={handleResume}
          disabled={resuming}
          className="w-full py-3 rounded-xl font-display font-semibold bg-white/10 border border-white/20 hover:bg-white/20 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
        >
          {resuming ? 'Resuming...' : `Continue Mining · ${fmt(profile.time_remaining)}`}
        </button>
      )}

      {canClaim && (
        <button
          onClick={handleClaim}
          disabled={claiming}
          className="w-full py-3 rounded-xl font-display font-semibold bg-green-600 hover:bg-green-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
        >
          {claiming ? 'Claiming...' : `Claim ₦${tierData.rate.toLocaleString()}`}
        </button>
      )}

      {/* ── Footer stats ─────────────────────────────────────── */}
      {(isRunning || isPaused) && (
        <div className="mt-4 pt-4 border-t border-edge grid grid-cols-2 gap-4 text-center">
          <div>
            <p className="text-white/40 mb-0.5 text-xs">This Cycle</p>
            <p className="font-display text-gold text-sm">
              ₦{tierData.rate.toLocaleString()}
            </p>
          </div>
          <div>
            <p className="text-white/40 mb-0.5 text-xs">Max / Day</p>
            <p className="font-display text-sm">
              ₦{(tierData.rate * 16).toLocaleString()}
            </p>
          </div>
        </div>
      )}
    </div>
  )
}

