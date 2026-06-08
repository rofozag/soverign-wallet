'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { useStore } from '@/lib/store'
import { TIERS } from '@/lib/constants'
import TierBadge from '@/components/TierBadge'
import ReferralCard from '@/components/ReferralCard'
import Nav from '@/components/Nav'

export default function AccountPage() {
  const router   = useRouter()
  const supabase = createClient()
  const { profile } = useStore()

  useEffect(() => {
    if (!profile) router.replace('/auth')
  }, [profile, router])

  const { data: withdrawals, isLoading } = useQuery({
    queryKey: ['withdrawals'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const { data, error } = await supabase
        .from('withdrawals')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (error) throw error
      return data
    },
    enabled: !!profile,
  })

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    window.location.href = '/auth'
  }

  if (!profile) return null

  const tierData = TIERS[profile.tier]

  return (
    <div className="min-h-screen pb-24 px-4 py-8">
      <div className="max-w-lg mx-auto space-y-5">

        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-display font-bold">Account</h1>
          <button
            onClick={handleSignOut}
            className="px-4 py-2 text-sm rounded-lg bg-void border border-edge hover:border-red-500/60 hover:text-red-400 transition-colors"
          >
            Sign Out
          </button>
        </div>

        {/* Profile */}
        <div className="card space-y-3">
          <h2 className="font-display font-semibold mb-2">Profile</h2>

          {[
            { label: 'Username',    value: `@${profile.username}` },
            { label: 'Mining Rate', value: `₦${tierData.rate.toLocaleString()}/cycle`, gold: true },
            {
              label: 'Withdrawals',
              value: profile.withdrawal_code_verified ? '✓ Unlocked' : '🔒 Locked',
              green: profile.withdrawal_code_verified,
              red:   !profile.withdrawal_code_verified,
            },
            {
              label: 'Member Since',
              value: new Date(profile.created_at).toLocaleDateString(),
            },
          ].map(({ label, value, gold, green, red }) => (
            <div key={label} className="flex items-center justify-between">
              <span className="text-white/50 text-sm">{label}</span>
              <span className={`text-sm font-display ${
                gold ? 'text-gold' : green ? 'text-green-400' : red ? 'text-red-400' : ''
              }`}>
                {value}
              </span>
            </div>
          ))}

          <div className="flex items-center justify-between pt-2 border-t border-edge">
            <span className="text-white/50 text-sm">Current Tier</span>
            <TierBadge tier={profile.tier} />
          </div>
        </div>

        {/* Stats */}
        <div className="card">
          <h2 className="font-display font-semibold mb-4">Stats</h2>
          <div className="grid grid-cols-2 gap-4">
            {[
              { label: 'Total Mined',  value: `₦${Number(profile.balance).toLocaleString()}` },
              { label: 'Cycles Done',  value: String(Math.floor(Number(profile.balance) / tierData.rate)) },
              { label: 'Max Daily',    value: `₦${(tierData.rate * 16).toLocaleString()}` },
              { label: 'Current Tier', value: tierData.name },
            ].map(({ label, value }) => (
              <div key={label} className="text-center bg-void rounded-xl p-4 border border-edge">
                <p className="text-xl font-display text-gold mb-1">{value}</p>
                <p className="text-xs text-white/40">{label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Referral Card */}
        <ReferralCard referralCode={profile.referral_code} />

        {/* Withdrawal History */}
        <div className="card">
          <h2 className="font-display font-semibold mb-4">Withdrawal History</h2>

          {isLoading ? (
            <div className="flex justify-center py-8">
              <div className="w-5 h-5 rounded-full border-2 border-gold border-t-transparent animate-spin" />
            </div>
          ) : withdrawals && withdrawals.length > 0 ? (
            <div className="space-y-3">
              {withdrawals.map((w) => (
                <div key={w.id} className="bg-void rounded-xl p-4 border border-edge">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-display font-semibold">
                      ₦{Number(w.amount).toLocaleString()}
                    </span>
                    <span className={`badge ${
                      w.status === 'paid'
                        ? 'bg-green-500/20 text-green-400'
                        : w.status === 'approved'
                        ? 'bg-blue-500/20 text-blue-400'
                        : 'bg-yellow-500/20 text-yellow-400'
                    }`}>
                      {w.status}
                    </span>
                  </div>
                  <p className="text-sm text-white/50">
                    {w.bank_name} · {w.acct_number}
                  </p>
                  <p className="text-xs text-white/30 mt-1">
                    {new Date(w.created_at).toLocaleString()}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-white/40 py-8 text-sm">No withdrawals yet</p>
          )}
        </div>

      </div>
      <Nav />
    </div>
  )
}
