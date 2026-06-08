export const CYCLE_SECONDS = 90 * 60
export const CYCLE_MS      = CYCLE_SECONDS * 1000

export const TIERS = {
  basic: { name: 'Basic',  rate: 500,  agentPrice: 0,     badge: 'FREE',   color: '#6b7280' },
  tier1: { name: 'Tier 1', rate: 800,  agentPrice: 5000,  badge: 'BRONZE', color: '#cd7f32' },
  tier2: { name: 'Tier 2', rate: 1200, agentPrice: 10000, badge: 'SILVER', color: '#94a3b8' },
  tier3: { name: 'Tier 3', rate: 1500, agentPrice: 15000, badge: 'GOLD',   color: '#f5c518' },
} as const

export type TierKey = keyof typeof TIERS

export const MIN_WITHDRAW    = 40_000
export const WITHDRAW_FEE    = 5_000       // updated from 12,000
export const REFERRAL_BONUS  = 5_000       // credited to referrer per signup

export const waLink = (msg: string) =>
  `https://wa.me/${process.env.NEXT_PUBLIC_WHATSAPP_NUMBER}?text=${encodeURIComponent(msg)}`

export const WA_MINER_MSG    = (tier: string) =>
  `Hi, I want to buy the ${tier} activation code for Sovereign Wallet`

export const WA_WITHDRAW_MSG =
  `Hi, I want to purchase a Sovereign Wallet withdrawal code (₦5,000)`
