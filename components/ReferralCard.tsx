'use client'

import { useState } from 'react'
import { REFERRAL_BONUS } from '@/lib/constants'

interface ReferralCardProps {
  referralCode: string | null
}

export default function ReferralCard({ referralCode }: ReferralCardProps) {
  const [copied, setCopied] = useState(false)

  if (!referralCode) return null

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(referralCode)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Fallback for devices without clipboard API
      const el = document.createElement('input')
      el.value = referralCode
      document.body.appendChild(el)
      el.select()
      document.execCommand('copy')
      document.body.removeChild(el)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  return (
    <div className="card">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <div className="w-9 h-9 rounded-xl bg-gold/10 border border-gold/30 flex items-center justify-center text-base">
          🎁
        </div>
        <div>
          <h3 className="font-display font-semibold">Referral Program</h3>
          <p className="text-xs text-white/50">Earn ₦{REFERRAL_BONUS.toLocaleString()} per friend</p>
        </div>
      </div>

      {/* How it works */}
      <div className="bg-void rounded-xl border border-edge p-4 mb-4 space-y-3">
        {[
          ['1', 'Share your code with a friend'],
          ['2', 'They enter it when signing up'],
          ['3', `₦${REFERRAL_BONUS.toLocaleString()} is instantly added to your balance`],
        ].map(([n, text]) => (
          <div key={n} className="flex items-start gap-3">
            <span className="w-5 h-5 rounded-full bg-gold/20 border border-gold/40 flex items-center justify-center text-[10px] font-display text-gold flex-shrink-0 mt-0.5">
              {n}
            </span>
            <span className="text-sm text-white/70">{text}</span>
          </div>
        ))}
      </div>

      {/* Code + copy button */}
      <div className="flex items-center gap-3">
        <div className="flex-1 bg-void border border-edge rounded-xl px-4 py-3">
          <p className="text-xs text-white/40 mb-0.5">Your Referral Code</p>
          <p className="font-mono font-bold text-gold tracking-widest text-base">
            {referralCode}
          </p>
        </div>

        <button
          onClick={handleCopy}
          className={`px-4 py-3 rounded-xl font-display font-semibold text-sm transition-all flex-shrink-0 ${
            copied
              ? 'bg-green-600/20 border border-green-600/40 text-green-400'
              : 'bg-gold text-void hover:bg-gold/90'
          }`}
        >
          {copied ? '✓ Copied!' : 'Copy'}
        </button>
      </div>
    </div>
  )
}
