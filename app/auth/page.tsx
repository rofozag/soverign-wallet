'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function AuthPage() {
  const [mode,     setMode]     = useState<'signup' | 'login'>('signup')
  const [username, setUsername] = useState('')
  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [refCode,  setRefCode]  = useState('')   // optional referral code
  const [loading,  setLoading]  = useState(false)
  const [error,    setError]    = useState('')
  const [info,     setInfo]     = useState('')

  const supabase = createClient()

  const reset = () => { setError(''); setInfo('') }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    reset()
    setLoading(true)

    try {
      if (mode === 'signup') {
        // ── Sign up ───────────────────────────────────────────
        const { data, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { username } },
        })

        if (signUpError) throw signUpError

        if (data.session) {
          // Email confirmation disabled — session is live immediately.
          // Apply referral code if provided (non-blocking).
          if (refCode.trim()) {
            try {
              await fetch('/api/apply-referral', {
                method:  'POST',
                headers: { 'Content-Type': 'application/json' },
                body:    JSON.stringify({ referral_code: refCode.trim() }),
              })
              // We don't throw on referral failure — user still gets through.
            } catch { /* silent */ }
          }

          window.location.href = '/dashboard'
        } else {
          // Email confirmation required — prompt the user.
          setInfo('Account created! Check your email to confirm, then sign in.')
          setMode('login')
        }

      } else {
        // ── Sign in ───────────────────────────────────────────
        const { data, error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        })

        if (signInError) throw signInError

        if (data.session) {
          window.location.href = '/dashboard'
        } else {
          throw new Error('Sign in failed. Please try again.')
        }
      }

    } catch (err: any) {
      setError(err.message || 'Authentication failed')
      setLoading(false)
    }
  }

  const switchMode = () => {
    setMode(m => m === 'signup' ? 'login' : 'signup')
    reset()
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-6 py-12">
      <div className="w-full max-w-md">

        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 mb-4 rounded-xl bg-gold/10 border border-gold/30">
            <svg className="w-7 h-7 text-gold" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h1 className="text-3xl font-display font-bold mb-2">
            {mode === 'signup' ? 'Create Account' : 'Welcome Back'}
          </h1>
          <p className="text-white/60">
            {mode === 'signup' ? 'Start mining Naira today' : 'Continue mining'}
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="card space-y-4">

          {mode === 'signup' && (
            <div>
              <label className="block text-sm font-medium mb-2">Username</label>
              <input
                type="text"
                value={username}
                onChange={e => setUsername(e.target.value)}
                required
                minLength={3}
                placeholder="Choose a username"
                disabled={loading}
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium mb-2">Email</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              placeholder="you@example.com"
              disabled={loading}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Password</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              minLength={6}
              placeholder="Minimum 6 characters"
              disabled={loading}
            />
          </div>

          {/* Referral code — sign up only */}
          {mode === 'signup' && (
            <div>
              <label className="block text-sm font-medium mb-2">
                Referral Code{' '}
                <span className="text-white/40 font-normal">(optional)</span>
              </label>
              <input
                type="text"
                value={refCode}
                onChange={e => setRefCode(e.target.value.toUpperCase())}
                placeholder="SW-XXXXXXXX"
                className="font-mono"
                disabled={loading}
              />
              <p className="text-xs text-white/40 mt-1.5">
                Got a code from a friend? Enter it to give them ₦5,000.
              </p>
            </div>
          )}

          {error && (
            <div className="text-sm text-red-400 bg-red-400/10 border border-red-400/20 rounded-lg px-4 py-3">
              {error}
            </div>
          )}

          {info && (
            <div className="text-sm text-green-400 bg-green-400/10 border border-green-400/20 rounded-lg px-4 py-3">
              {info}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl font-display font-semibold bg-gold text-void hover:bg-gold/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            {loading
              ? 'Please wait...'
              : mode === 'signup'
              ? 'Create Account'
              : 'Sign In'}
          </button>

          <div className="text-center text-sm">
            <button
              type="button"
              onClick={switchMode}
              className="text-gold hover:underline"
            >
              {mode === 'signup'
                ? 'Already have an account? Sign in'
                : "Don't have an account? Sign up"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
