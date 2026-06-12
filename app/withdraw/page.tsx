'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { useStore } from '@/lib/store'
import { MIN_WITHDRAW, WITHDRAW_FEE, WA_WITHDRAW_MSG, waLink } from '@/lib/constants'
import Nav from '@/components/Nav'

export default function WithdrawPage() {
  const router      = useRouter()
  const queryClient = useQueryClient()
  const supabase    = createClient()
  const { profile, setProfile, updateBalance } = useStore()

  const [step, setStep]             = useState<'code' | 'details'>('code')
  const [code, setCode]             = useState('')
  const [verifying, setVerifying]   = useState(false)

  const [acctNumber, setAcctNumber] = useState('')
  const [bankName, setBankName]     = useState('')
  const [acctHolder, setAcctHolder] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const [error, setError]   = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    if (!profile) router.replace('/auth')
  }, [profile, router])

  if (!profile) return null

  const canWithdraw   = Number(profile.balance) >= MIN_WITHDRAW
  const alreadyUnlocked = profile.withdrawal_code_verified

  // ── Verify withdrawal code ──────────────────────────────────
  const handleVerifyCode = async () => {
    if (!code.trim()) { setError('Enter your withdrawal code'); return }
    setError('')
    setVerifying(true)

    try {
      const res  = await fetch('/api/verify-withdrawal-code', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ code: code.trim() }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Verification failed')

      // Sync fresh profile returned from API (service role guaranteed update)
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
        setProfile(freshProfile)
        queryClient.setQueryData(['profile'], freshProfile)
      }

      setStep('details')
    } catch (err: any) {
      setError(err.message)
    } finally {
      setVerifying(false)
    }
  }

  // ── Submit withdrawal ───────────────────────────────────────
  const handleSubmitWithdrawal = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    setSubmitting(true)

    try {
      const res  = await fetch('/api/request-withdrawal', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          acct_number: acctNumber,
          bank_name:   bankName,
          acct_holder: acctHolder,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Withdrawal request failed')

      // Invalidate so dashboard re-fetches updated balance
      // Immediately update Zustand balance so dashboard reflects it right away
      updateBalance(Number(profile!.balance) - MIN_WITHDRAW)
      queryClient.invalidateQueries({ queryKey: ['profile'] })
      queryClient.invalidateQueries({ queryKey: ['withdrawals'] })

      setSuccess('Withdrawal submitted! Processing within 24–48 hours.')
      setTimeout(() => router.push('/dashboard'), 2000)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  const showCodeForm = canWithdraw && !alreadyUnlocked && step === 'code'
  const showBankForm = canWithdraw && (alreadyUnlocked || step === 'details')

  return (
    <div className="min-h-screen pb-24 px-4 py-8">
      <div className="max-w-lg mx-auto space-y-5">

        <div>
          <h1 className="text-2xl font-display font-bold mb-1">Withdraw Funds</h1>
          <p className="text-white/50 text-sm">Cash out to your Nigerian bank account</p>
        </div>

        {/* Balance */}
        <div className="card">
          <div className="flex items-start justify-between mb-3">
            <div>
              <p className="text-xs text-white/50 mb-1">Available Balance</p>
              <p className="text-3xl font-display font-bold">
                ₦{Number(profile.balance).toLocaleString()}
              </p>
            </div>
            <span className={`badge ${canWithdraw ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
              {canWithdraw ? 'Eligible' : 'Insufficient'}
            </span>
          </div>
          <p className="text-sm text-white/50">Minimum: ₦{MIN_WITHDRAW.toLocaleString()}</p>
        </div>

        {!canWithdraw && (
          <div className="card border-red-500/30 bg-red-500/10">
            <p className="text-sm text-red-300">
              Keep mining! You need ₦{(MIN_WITHDRAW - Number(profile.balance)).toLocaleString()} more.
            </p>
          </div>
        )}

        {/* Step 1 — buy & enter withdrawal code */}
        {showCodeForm && (
          <div className="card space-y-4">
            <div>
              <h3 className="font-display font-semibold mb-1">Unlock Withdrawals</h3>
              <p className="text-sm text-white/50">
                Purchase a one-time unlock code (₦{WITHDRAW_FEE.toLocaleString()}) from our WhatsApp agent.
              </p>
            </div>

            <a
              href={waLink(WA_WITHDRAW_MSG)}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center w-full py-3 rounded-xl font-display font-semibold bg-green-600 hover:bg-green-700 transition-all text-white"
            >
              Buy Code via WhatsApp
            </a>

            <div className="pt-4 border-t border-edge space-y-3">
              <label className="block text-sm font-medium">Enter Code</label>
              <input
                type="text"
                value={code}
                onChange={(e) => { setCode(e.target.value.toUpperCase()); setError('') }}
                placeholder="SW-WD-XXXXXX"
                className="font-mono"
                disabled={verifying}
              />

              {error && (
                <div className="text-sm text-red-400 bg-red-400/10 border border-red-400/20 rounded-lg px-4 py-3">
                  {error}
                </div>
              )}

              <button
                onClick={handleVerifyCode}
                disabled={verifying || !code.trim()}
                className="w-full py-3 rounded-xl font-display font-semibold bg-gold text-void hover:bg-gold/90 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              >
                {verifying ? 'Verifying...' : 'Unlock Withdrawals'}
              </button>
            </div>
          </div>
        )}

        {/* Step 2 — bank details */}
        {showBankForm && (
          <form onSubmit={handleSubmitWithdrawal} className="card space-y-4">
            <h3 className="font-display font-semibold">Bank Details</h3>

            <div>
              <label className="block text-sm font-medium mb-2">Account Number</label>
              <input
                type="text"
                value={acctNumber}
                onChange={(e) => setAcctNumber(e.target.value.replace(/\D/g, ''))}
                placeholder="0123456789"
                required
                maxLength={10}
                disabled={submitting}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Bank Name</label>
              <input
                type="text"
                value={bankName}
                onChange={(e) => setBankName(e.target.value)}
                placeholder="e.g. Access Bank"
                required
                disabled={submitting}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Account Holder</label>
              <input
                type="text"
                value={acctHolder}
                onChange={(e) => setAcctHolder(e.target.value)}
                placeholder="Full name on account"
                required
                disabled={submitting}
              />
            </div>

            <div className="bg-void rounded-lg p-4 border border-edge space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-white/50">Amount</span>
                <span className="font-display font-bold">₦{MIN_WITHDRAW.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/50">Remaining</span>
                <span className="font-display">
                  ₦{(Number(profile.balance) - MIN_WITHDRAW).toLocaleString()}
                </span>
              </div>
            </div>

            {error && (
              <div className="text-sm text-red-400 bg-red-400/10 border border-red-400/20 rounded-lg px-4 py-3">
                {error}
              </div>
            )}
            {success && (
              <div className="text-sm text-green-400 bg-green-400/10 border border-green-400/20 rounded-lg px-4 py-3">
                {success}
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3 rounded-xl font-display font-semibold bg-gold text-void hover:bg-gold/90 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            >
              {submitting ? 'Submitting...' : 'Request Withdrawal'}
            </button>

            <p className="text-xs text-white/40 text-center">Processing time: 24–48 hours</p>
          </form>
        )}

      </div>
      <Nav />
    </div>
  )
}

