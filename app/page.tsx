import Link from 'next/link'

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 relative overflow-hidden">
      {/* Background grid */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:48px_48px] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_50%,black,transparent)]" />
      
      <div className="relative z-10 text-center max-w-2xl animate-fadeUp">
        {/* Logo */}
        <div className="inline-flex items-center justify-center w-20 h-20 mb-6 rounded-2xl bg-gradient-to-br from-gold/20 to-gold/5 border border-gold/30">
          <svg className="w-10 h-10 text-gold" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>

        <h1 className="text-5xl md:text-6xl font-display font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-white via-gold to-white">
          Sovereign Wallet
        </h1>
        
        <p className="text-lg md:text-xl text-white/70 mb-2">
          Digital Naira Mining Platform
        </p>
        
        <p className="text-sm text-white/50 mb-12 max-w-md mx-auto">
          Mine ₦500–₦1,500 every 90 minutes. Tier-based earnings. Secure withdrawals to your bank account.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/auth"
            className="px-8 py-4 rounded-xl font-display font-semibold bg-gold text-void hover:bg-gold/90 transition-all hover:scale-105 shadow-lg shadow-gold/20"
          >
            Get Started
          </Link>
          
          <Link
            href="/auth"
            className="px-8 py-4 rounded-xl font-display font-semibold bg-surface border border-edge hover:border-gold transition-all"
          >
            Sign In
          </Link>
        </div>

        {/* Features */}
        <div className="grid grid-cols-3 gap-6 mt-16 text-sm">
          <div>
            <div className="text-2xl font-display text-gold mb-2">₦1.5K</div>
            <div className="text-white/60">Max per Cycle</div>
          </div>
          <div>
            <div className="text-2xl font-display text-gold mb-2">90min</div>
            <div className="text-white/60">Cycle Duration</div>
          </div>
          <div>
            <div className="text-2xl font-display text-gold mb-2">4</div>
            <div className="text-white/60">Tier Levels</div>
          </div>
        </div>
      </div>
    </div>
  )
}
