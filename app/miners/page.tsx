'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { useStore } from '@/lib/store'
import { TIERS, WA_MINER_MSG, waLink } from '@/lib/constants'
import TierBadge from '@/components/TierBadge'
import Nav from '@/components/Nav'

export default function MinersPage() {
  const router       = useRouter()
  const queryClient  = useQueryClient()
  const supabase     = createClient()
  const { profile, setProfile } = useStore()

  const [code, setCode]             = useState('')
  const [activating, setActivating] = useState(false)
  const [error, setError]           = useState('')
  const [success, setSuccess]       = useState('')

  useEffect(() => {
    if (!profile) router.replace('/auth')
  }, [profile, router])

  const handleActivate = async () => {
    if (!code.trim()) { setError('Enter an activation code'); return }
    setError('')
    setSuccess('')
    setActivating(true)

    try {
      // ── Step 1: call the API ──────────────────────────────────
      const res  = await fetch('/api/activate-tier', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ code: code.trim() }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Activation failed')

      // ── Step 2: sync state from the profile the API returned ──
      // API now returns the full updated profile so we don't need
      // a separate round-trip. If for any reason it's null, we
      // fall back to a fresh client-side fetch.
      let freshProfile = data.profile

      if (!freshProfile) {
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
          const { data: fetched } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single()
          freshProfile = fetched ?? null
        }
      }

      if (freshProfile) {
        // Write to Zustand so all components see the new tier instantly
        setProfile(freshProfile)
        // Write to React Query cache so dashboard's useQuery is up-to-date
        queryClient.setQueryData(['profile'], freshProfile)
      }

      setSuccess(`Tier activated! You are now on ${TIERS[data.tier as keyof typeof TIERS]?.name ?? data.tier}.`)
      setCode('')

      // ── Step 3: soft navigate — Zustand & React Query survive ─
      // router.push keeps the React app alive so stores are preserved.
      // No more window.location.href here.
      setTimeout(() => router.push('/dashboard'), 1200)

    } catch (err: any) {
      setError(err.message)
    } finally {
      setActivating(false)
    }
  }

  if (!profile) return null

  return (
    <div className="min-h-screen pb-24 px-4 py-8">
      <div className="max-w-lg mx-auto space-y-5">

        <div>
          <h1 className="text-2xl font-display font-bold mb-1">Miner Upgrades</h1>
          <p className="text-white/50 text-sm">Increase your earnings by upgrading your tier</p>
        </div>

        {/* Current Tier */}
        <div className="card flex items-center justify-between">
          <div>
            <p className="text-xs text-white/50 mb-1">Current Tier</p>
            <p className="text-xl font-display font-bold">{TIERS[profile.tier].name}</p>
          </div>
          <TierBadge tier={profile.tier} />
        </div>

        {/* All Tiers */}
        <div className="space-y-3">
          {(Object.entries(TIERS) as [keyof typeof TIERS, typeof TIERS[keyof typeof TIERS]][]).map(
            ([key, tier]) => {
              const isCurrent = key === profile.tier
              const isFree    = key === 'basic'
              return (
                <div
                  key={key}
                  className={`card transition-colors ${isCurrent ? 'border-gold/60' : ''} ${isFree ? 'opacity-50' : ''}`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <p className="font-display font-bold text-base mb-0.5">{tier.name}</p>
                      <p className="text-xl font-display text-gold">
                        ₦{tier.rate.toLocaleString()}/cycle
                      </p>
                    </div>
                    <span
                      className="badge"
                      style={{
                        backgroundColor: `${tier.color}22`,
                        color:           tier.color,
                        borderColor:     `${tier.color}44`,
                        borderWidth:     1,
                      }}
                    >
                      {tier.badge}
                    </span>
                  </div>

                  {tier.agentPrice > 0 && (
                    <div className="flex items-center justify-between pt-3 border-t border-edge">
                      <p className="text-sm text-white/50">
                        ₦{tier.agentPrice.toLocaleString()}
                      </p>
                      {!isCurrent && (
                        <a
                          href={waLink(WA_MINER_MSG(tier.name))}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-4 py-1.5 rounded-lg text-sm font-display font-semibold border border-gold text-gold hover:bg-gold hover:text-void transition-all"
                        >
                          Buy via WhatsApp
                        </a>
                      )}
                    </div>
                  )}

                  {isCurrent && (
                    <div className="pt-3 border-t border-edge">
                      <p className="text-sm text-gold">✓ Active</p>
                    </div>
                  )}
                </div>
              )
            }
          )}
        </div>

        {/* Activation Code */}
        <div className="card">
          <h3 className="font-display font-semibold mb-1">Have a Code?</h3>
          <p className="text-sm text-white/50 mb-4">
            Enter your activation code from the WhatsApp agent below
          </p>

          <input
            type="text"
            value={code}
            onChange={(e) => {
              setCode(e.target.value.toUpperCase())
              setError('')
            }}
            placeholder="SW-T1-XXXXX"
            className="font-mono mb-4"
            disabled={activating}
          />

          {error && (
            <div className="text-sm text-red-400 bg-red-400/10 border border-red-400/20 rounded-lg px-4 py-3 mb-4">
              {error}
            </div>
          )}
          {success && (
            <div className="text-sm text-green-400 bg-green-400/10 border border-green-400/20 rounded-lg px-4 py-3 mb-4">
              {success}
            </div>
          )}

          <button
            onClick={handleActivate}
            disabled={activating || !code.trim()}
            className="w-full py-3 rounded-xl font-display font-semibold bg-gold text-void hover:bg-gold/90 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
          >
            {activating ? 'Activating...' : 'Activate Tier'}
          </button>
        </div>

      </div>
      <Nav />
    </div>
  )
}
