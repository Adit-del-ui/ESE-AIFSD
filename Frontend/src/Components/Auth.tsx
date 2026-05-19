import React, { useState } from 'react'

const API_BASE = (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/$/, '') ?? ''

export default function Auth({ onAuth }: { onAuth?: () => void }) {
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [name, setName]         = useState('')
  const [mode, setMode]         = useState<'login' | 'signup'>('login')
  const [status, setStatus]     = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [msg, setMsg]           = useState<string | null>(null)
  const [showPw, setShowPw]     = useState(false)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setStatus('loading'); setMsg(null)
    try {
      const path = mode === 'login' ? '/api/auth/login' : '/api/auth/signup'
      const body = mode === 'login' ? { email, password } : { name, email, password }
      const res = await fetch(API_BASE + path, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || data.message || JSON.stringify(data))

      if (mode === 'login') {
        localStorage.setItem('token', data.token)
        setStatus('success')
        setMsg('Logged in successfully! Redirecting...')
        setTimeout(() => onAuth && onAuth(), 800)
      } else {
        setStatus('success')
        setMsg('Account created! Please login.')
        setTimeout(() => { setMode('login'); setStatus('idle'); setMsg(null) }, 1500)
      }
    } catch (err: any) {
      setStatus('error')
      setMsg(err.message || String(err))
    }
  }

  function switchMode() {
    setMode(m => m === 'login' ? 'signup' : 'login')
    setStatus('idle'); setMsg(null)
  }

  return (
    <div className="auth-container">
      <div className="auth-card">
        {/* Logo */}
        <div className="auth-logo">
          <div className="logo-ring">🏛️</div>
          <h2>CivicAlert</h2>
          <p>{mode === 'login' ? 'Sign in to your account' : 'Create a new account'}</p>
        </div>

        {/* Tab strip */}
        <div className="tab-strip" style={{ width: '100%', justifyContent: 'center', display: 'flex' }}>
          <button className={`tab-btn ${mode === 'login' ? 'active' : ''}`} onClick={() => { setMode('login'); setStatus('idle'); setMsg(null) }}>
            Login
          </button>
          <button className={`tab-btn ${mode === 'signup' ? 'active' : ''}`} onClick={() => { setMode('signup'); setStatus('idle'); setMsg(null) }}>
            Sign Up
          </button>
        </div>

        <form className="auth-form" onSubmit={submit}>
          {mode === 'signup' && (
            <div className="form-group">
              <label className="form-label" htmlFor="auth-name">Full Name</label>
              <input id="auth-name" className="form-input" placeholder="Your full name"
                value={name} onChange={e => setName(e.target.value)} />
            </div>
          )}

          <div className="form-group">
            <label className="form-label" htmlFor="auth-email">Email Address</label>
            <input id="auth-email" className="form-input" type="email" placeholder="you@example.com"
              value={email} onChange={e => setEmail(e.target.value)} required />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="auth-password">Password</label>
            <div style={{ position: 'relative' }}>
              <input id="auth-password" className="form-input"
                type={showPw ? 'text' : 'password'}
                placeholder="••••••••"
                value={password} onChange={e => setPassword(e.target.value)}
                required style={{ paddingRight: 44 }} />
              <button type="button"
                style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                  background: 'none', border: 'none', cursor: 'pointer', fontSize: 16, color: 'var(--text-2)' }}
                onClick={() => setShowPw(v => !v)}>
                {showPw ? '🙈' : '👁️'}
              </button>
            </div>
          </div>

          <button type="submit" className="btn btn-primary btn-full" disabled={status === 'loading'}>
            {status === 'loading' ? <><span className="spinner" /> {mode === 'login' ? 'Signing in...' : 'Creating account...'}</>
              : mode === 'login' ? '🔐 Sign In' : '🚀 Create Account'}
          </button>
        </form>

        {msg && (
          <div className={`alert ${status === 'success' ? 'alert-success' : status === 'error' ? 'alert-error' : 'alert-loading'}`}>
            {msg}
          </div>
        )}

        {/* Note for first signup */}
        {mode === 'signup' && (
          <div style={{ marginTop: 12, padding: '10px 14px', background: 'var(--accent-bg)', borderRadius: 8,
            fontSize: 13, color: 'var(--accent-2)', border: '1px solid rgba(99,102,241,0.2)' }}>
            💡 The very first registered user is automatically granted <strong>Admin</strong> privileges.
          </div>
        )}

        <div className="auth-switch" style={{ marginTop: 16 }}>
          {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
          <button onClick={switchMode}>
            {mode === 'login' ? 'Sign up' : 'Login'}
          </button>
        </div>
      </div>
    </div>
  )
}
