import { create } from 'zustand'
import { Profile } from '@/lib/types'

interface Store {
  // ── Profile ─────────────────────────────────────────────────
  profile:              Profile | null
  setProfile:           (p: Profile | null) => void
  updateBalance:        (newBalance: number) => void
  updateTier:           (newTier: Profile['tier']) => void
  updateMiningStart:    (ts: string | null) => void
  updateTimeRemaining:  (t: number | null) => void
  setWithdrawalVerified:(verified: boolean) => void

  // ── Global mining timer (survives page navigation) ──────────
  // timerSeconds: the live countdown value displayed in the UI.
  // timerPaused:  true when the user has left the tab and mining
  //               is suspended — shows "Continue Mining" button.
  timerSeconds:     number | null
  timerPaused:      boolean
  setTimerSeconds:  (s: number | null) => void
  setTimerPaused:   (paused: boolean) => void
  decrementTimer:   () => void          // called every second by MiningTimer
}

export const useStore = create<Store>((set) => ({
  // ── Profile ─────────────────────────────────────────────────
  profile:    null,
  setProfile: (p) => set({ profile: p }),

  updateBalance: (newBalance) =>
    set((s) =>
      s.profile ? { profile: { ...s.profile, balance: newBalance } } : s
    ),

  updateTier: (newTier) =>
    set((s) =>
      s.profile ? { profile: { ...s.profile, tier: newTier } } : s
    ),

  updateMiningStart: (ts) =>
    set((s) =>
      s.profile ? { profile: { ...s.profile, mining_start: ts } } : s
    ),

  updateTimeRemaining: (t) =>
    set((s) =>
      s.profile ? { profile: { ...s.profile, time_remaining: t } } : s
    ),

  setWithdrawalVerified: (verified) =>
    set((s) =>
      s.profile ? { profile: { ...s.profile, withdrawal_code_verified: verified } } : s
    ),

  // ── Global mining timer ──────────────────────────────────────
  timerSeconds:    null,
  timerPaused:     false,
  setTimerSeconds: (s) => set({ timerSeconds: s }),
  setTimerPaused:  (paused) => set({ timerPaused: paused }),

  decrementTimer: () =>
    set((s) => {
      if (s.timerSeconds === null || s.timerSeconds <= 0) return s
      return { timerSeconds: s.timerSeconds - 1 }
    }),
}))
