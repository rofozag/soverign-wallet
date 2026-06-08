import { TierKey } from './constants'

export interface Profile {
  id:                       string
  username:                 string
  balance:                  number
  tier:                     TierKey
  mining_start:             string | null
  time_remaining:           number | null
  withdrawal_code_verified: boolean
  referral_code:            string | null
  referred_by:              string | null
  created_at:               string
}

export interface Withdrawal {
  id:          string
  user_id:     string
  amount:      number
  acct_number: string
  bank_name:   string
  acct_holder: string
  status:      'pending' | 'approved' | 'paid'
  created_at:  string
}
