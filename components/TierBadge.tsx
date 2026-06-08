import { TIERS, TierKey } from '@/lib/constants'

interface TierBadgeProps {
  tier: TierKey
}

export default function TierBadge({ tier }: TierBadgeProps) {
  const tierData = TIERS[tier]

  return (
    <span
      className="badge"
      style={{
        backgroundColor: `${tierData.color}22`,
        color: tierData.color,
        borderColor: `${tierData.color}44`,
        borderWidth: '1px',
      }}
    >
      {tierData.badge}
    </span>
  )
}
