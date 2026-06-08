'use client'

import { useEffect } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { useStore } from '@/lib/store'
import { TIERS } from '@/lib/constants'
import MiningEngine from '@/components/MiningEngine'
import TierBadge from '@/components/TierBadge'
import Nav from '@/components/Nav'
import Link from 'next/link'

export default function DashboardPage() {
  const supabase    = createClient()
  const queryClient = useQueryClient()
  const { profile, setProfile } = useStore()

  const { data, isLoading, isError } = useQuery({
    queryKey: ['profile'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const { data: prof, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      if (error) throw error
      return prof
    },
  })

  useEffect(() => {
    if (data) setProfile(data)
  }, [data, setProfile])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    queryClient.clear()
    window.location.href = '/auth'
  }

  // ── Loading: only show full spinner on first load (no profile yet) ──
  // If we already have a profile in Zustand from a previous fetch,
  // render the page immediately while React Query refreshes in the
  // background. This prevents the mining engine from flickering off
  // when the user navigates back to this page.
  if (isLoading && !profile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-6 h-6 rounded-full border-2 border-gold border-t-transparent animate-spin" />
      </div>
    )
  }

  if ((isError && !profile) || !profile) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 px-6 text-center">
        <p className="text-white/60 text-sm">Could not load your profile.</p>
        <button
          onClick={() => queryClient.invalidateQueries({ queryKey: ['profile'] })}
          className="px-6 py-3 rounded-xl font-display font-semibold bg-gold text-void text-sm"
        >
          Retry
        </button>
      </div>
    )
  }

  const tierData = TIERS[profile.tier]

  return (
    <div className="min-h-screen pb-24 px-4 py-8">
      <div className="max-w-lg mx-auto space-y-5">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-display font-bold">Dashboard</h1>
            <p className="text-white/50 text-sm mt-0.5">@{profile.username}</p>
          </div>
          <button
            onClick={handleSignOut}
            className="px-4 py-2 text-sm rounded-lg bg-void border border-edge hover:border-red-500/60 hover:text-red-400 transition-colors"
          >
            Sign Out
          </button>
        </div>

        {/* Balance Card */}
        <div className="card">
          <div className="flex items-start justify-between mb-5">
            <div>
              <p className="text-xs text-white/50 mb-1 tracking-wide uppercase">Total Balance</p>
              <p className="text-4xl font-display font-bold">
                ₦{Number(profile.balance).toLocaleString()}
              </p>
            </div>
            <TierBadge tier={profile.tier} />
          </div>

          <div className="grid grid-cols-2 gap-4 pt-4 border-t border-edge">
            <div>
              <p className="text-xs text-white/50 mb-1">Mining Rate</p>
              <p className="text-base font-display text-gold">
                ₦{tierData.rate.toLocaleString()}/cycle
              </p>
            </div>
            <div>
              <p className="text-xs text-white/50 mb-1">Withdrawals</p>
              <p className="text-base font-display">
                {profile.withdrawal_code_verified ? '✓ Unlocked' : '🔒 Locked'}
              </p>
            </div>
          </div>
        </div>

        {/* Mining Engine reads timer from Zustand — no flicker on navigation */}
        <MiningEngine />

        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-4">
          <Link href="/miners" className="card hover:border-gold/60 transition-colors text-center">
            <div className="text-2xl mb-2">⛏️</div>
            <p className="font-display font-semibold text-sm">Upgrade Miner</p>
            <p className="text-xs text-white/40 mt-1">Increase earnings</p>
          </Link>

          <Link href="/withdraw" className="card hover:border-gold/60 transition-colors text-center">
            <div className="text-2xl mb-2">💰</div>
            <p className="font-display font-semibold text-sm">Withdraw</p>
            <p className="text-xs text-white/40 mt-1">Cash out funds</p>
          </Link>
        </div>

      </div>
      <Nav />
    </div>
  )
}
