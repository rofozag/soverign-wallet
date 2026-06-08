export type Json =
  | string | number | boolean | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id:                       string
          username:                 string
          balance:                  number
          tier:                     'basic' | 'tier1' | 'tier2' | 'tier3'
          mining_start:             string | null
          time_remaining:           number | null
          withdrawal_code_verified: boolean
          referral_code:            string | null
          referred_by:              string | null
          created_at:               string
        }
        Insert: {
          id:                        string
          username:                  string
          balance?:                  number
          tier?:                     'basic' | 'tier1' | 'tier2' | 'tier3'
          mining_start?:             string | null
          time_remaining?:           number | null
          withdrawal_code_verified?: boolean
          referral_code?:            string | null
          referred_by?:              string | null
          created_at?:               string
        }
        Update: {
          id?:                       string
          username?:                 string
          balance?:                  number
          tier?:                     'basic' | 'tier1' | 'tier2' | 'tier3'
          mining_start?:             string | null
          time_remaining?:           number | null
          withdrawal_code_verified?: boolean
          referral_code?:            string | null
          referred_by?:              string | null
          created_at?:               string
        }
      }
      withdrawals: {
        Row: {
          id:          string
          user_id:     string
          amount:      number
          acct_number: string
          bank_name:   string
          acct_holder: string
          status:      'pending' | 'approved' | 'paid'
          created_at:  string
        }
        Insert: {
          id?:          string
          user_id:      string
          amount?:      number
          acct_number:  string
          bank_name:    string
          acct_holder:  string
          status?:      'pending' | 'approved' | 'paid'
          created_at?:  string
        }
        Update: {
          id?:          string
          user_id?:     string
          amount?:      number
          acct_number?: string
          bank_name?:   string
          acct_holder?: string
          status?:      'pending' | 'approved' | 'paid'
          created_at?:  string
        }
      }
    }
  }
}
