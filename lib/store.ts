import { create } from 'zustand'
import { Profile } from '@/lib/types'

interface Store {
  // ── Profile ──────────────────────────────────────────────────
  profile:               Profile | null
  setProfile:            (p: Profile | null) => void
  updateBalance:         (newBalance: number) => void
  updateTier:            (newTier: Profile['tier']) => void
  updateMiningStart:     (ts: string | null) => void
  updateTimeRemaining:   (t: number | null) => void
  setWithdrawalVerified: (verified: boolean) => void

  // ── Pause flag ───────────────────────────────────────────────
  // True when the user left the tab and mining was suspended.
  // MiningEngine reads this to show the "Continue Mining" button.
  miningPaused:    boolean
  setMiningPaused: (p: boolean) => void
}

export const useStore = create<Store>((set) => ({
  // ── Profile ──────────────────────────────────────────────────
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

  // ── Pause flag ───────────────────────────────────────────────
  miningPaused:    false,
  setMiningPaused: (p) => set({ miningPaused: p }),
}))
