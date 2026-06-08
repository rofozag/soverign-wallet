# Sovereign Wallet

Nigerian Naira digital mining platform with tier-based earnings and secure withdrawals.

## Features

- **Digital Naira Mining**: Earn ₦500-₦1,500 every 90 minutes
- **Tier System**: 4 tiers (Basic → Tier 1 → Tier 2 → Tier 3)
- **Secure Withdrawals**: Minimum ₦350,000 withdrawal to Nigerian bank accounts
- **WhatsApp Agent Integration**: Purchase tier upgrades and withdrawal codes via WhatsApp
- **Real-time Mining Engine**: Live countdown timer with progress visualization

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Database**: Supabase (PostgreSQL)
- **Auth**: Supabase Auth
- **State**: Zustand + TanStack Query
- **Deployment**: Vercel

## Setup Instructions

### 1. Prerequisites

- Node.js 18+ installed
- Supabase account
- WhatsApp Business number

### 2. Clone & Install

```bash
git clone <your-repo-url>
cd sovereign-wallet
npm install
```

### 3. Supabase Setup

1. Create a new Supabase project at [supabase.com](https://supabase.com)
2. Run the migrations:
   - Go to SQL Editor in Supabase dashboard
   - Copy and paste contents of `supabase/migrations/001_initial.sql`
   - Execute
   - Copy and paste contents of `supabase/migrations/002_seed_codes.sql`
   - Execute

3. Get your API keys:
   - Go to Project Settings → API
   - Copy `Project URL` and `anon public` key
   - Go to Project Settings → API → Service Role (reveal and copy)

### 4. Environment Variables

Create `.env.local` in the root directory:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
NEXT_PUBLIC_WHATSAPP_NUMBER=2348000000000
```

**Replace:**
- `your_supabase_project_url` with your Supabase project URL
- `your_supabase_anon_key` with your anon key
- `your_service_role_key` with your service role key
- `2348000000000` with your WhatsApp Business number (with country code, no +)

### 5. Update Activation Codes (Important!)

Before going live, update the codes in `supabase/migrations/002_seed_codes.sql`:

```sql
-- Change these to unique codes
insert into public.activation_codes (code, tier) values
  ('SW-T1-YOUR1', 'tier1'),  -- Change YOUR1
  ('SW-T2-YOUR2', 'tier2'),  -- Change YOUR2
  ('SW-T3-YOUR3', 'tier3');  -- Change YOUR3

-- Add withdrawal codes (add more as you sell them)
insert into public.withdrawal_codes (code) values
  ('SW-WD-UNIQUE1'),  -- Change these
  ('SW-WD-UNIQUE2'),
  ('SW-WD-UNIQUE3');
```

Run the updated migration in Supabase SQL Editor.

### 6. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### 7. Deploy to Vercel

```bash
npm run build  # Test production build locally
vercel         # Deploy to Vercel
```

Add environment variables in Vercel dashboard (Settings → Environment Variables).

## Business Model

### Revenue Streams

1. **Miner Tier Upgrades** (via WhatsApp):
   - Tier 1: ₦7,500
   - Tier 2: ₦15,000
   - Tier 3: ₦20,000

2. **Withdrawal Code** (one-time per user): ₦12,000

### How It Works

1. User signs up (free, Basic tier)
2. User mines ₦500 every 90 minutes
3. User contacts WhatsApp agent to buy tier upgrade
4. Agent provides activation code
5. User enters code in app → tier upgraded
6. When balance reaches ₦350,000, user buys withdrawal code from agent
7. User enters code → withdrawals unlocked
8. User submits bank details → you manually process payment

## Admin Tasks

### Adding Withdrawal Codes

When you sell a withdrawal code to a user, add it to the database:

1. Go to Supabase → Table Editor → `withdrawal_codes`
2. Insert new row with the code you generated
3. Give that code to the user

### Processing Withdrawals

1. Go to Supabase → Table Editor → `withdrawals`
2. View pending requests
3. Transfer money to the user's bank account
4. Update status to `paid`

### Managing Activation Codes

Codes are reusable. One code per tier. Users just need to know the code to activate.

## Security Notes

- Never commit `.env.local` to Git
- Keep service role key secret (server-side only)
- Change default codes before launch
- Generate unique withdrawal codes for each sale
- Monitor Supabase logs for suspicious activity

## Customization

- **Colors**: Edit `tailwind.config.ts`
- **Fonts**: Change in `app/globals.css`
- **Rates**: Update `lib/constants.ts`
- **Cycle duration**: Change `CYCLE_MS` in `lib/constants.ts`
- **Minimum withdrawal**: Update `MIN_WITHDRAW` in `lib/constants.ts`

## Support

For issues, check:
1. Supabase logs (Dashboard → Logs)
2. Browser console (F12)
3. Vercel deployment logs

## License

All rights reserved. Rofiozag Dev © 2025
