import { useState } from 'react'
import { signIn, signUp } from '../lib/supabase'

export default function AuthPage() {
  const [mode, setMode] = useState('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState(null)
  const [error, setError] = useState(null)

  const handle = async (e) => {
    e.preventDefault()
    setLoading(true); setError(null); setMessage(null)
    const fn = mode === 'login' ? signIn : signUp
    const { error: err } = await fn(email, password)
    setLoading(false)
    if (err) return setError(err.message)
    if (mode === 'signup') setMessage('Check your email to confirm your account.')
  }

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'var(--bg)', padding: '24px',
    }}>
      <div style={{ width: '100%', maxWidth: 420 }} className="fade-in">
        {/* Logo */}
        <div style={{ marginBottom: 40, textAlign: 'center' }}>
          <div style={{
            fontFamily: 'var(--font-display)', fontSize: 38, color: 'var(--text)',
            letterSpacing: '-0.5px', lineHeight: 1,
          }}>Apex</div>
          <div style={{ color: 'var(--muted)', fontSize: 13, marginTop: 6, fontFamily: 'var(--font-mono)' }}>
            Investment Research · Personal
          </div>
        </div>

        <div style={{
          background: 'var(--surface)', border: '1px solid var(--border)',
          borderRadius: 'var(--radius-lg)', padding: '32px',
        }}>
          <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 24 }}>
            {mode === 'login' ? 'Sign in' : 'Create account'}
          </h2>

          <form onSubmit={handle}>
            <div style={{ marginBottom: 16 }}>
              <label style={{ display:'block', fontSize:12, color:'var(--text2)', marginBottom:6 }}>Email</label>
              <input
                type="email" value={email} onChange={e => setEmail(e.target.value)} required
                style={{
                  width:'100%', background:'var(--surface2)', border:'1px solid var(--border2)',
                  color:'var(--text)', padding:'10px 12px', borderRadius:'var(--radius)',
                  fontSize:14, outline:'none',
                }}
                onFocus={e => e.target.style.borderColor='var(--accent)'}
                onBlur={e => e.target.style.borderColor='var(--border2)'}
              />
            </div>
            <div style={{ marginBottom: 24 }}>
              <label style={{ display:'block', fontSize:12, color:'var(--text2)', marginBottom:6 }}>Password</label>
              <input
                type="password" value={password} onChange={e => setPassword(e.target.value)} required
                style={{
                  width:'100%', background:'var(--surface2)', border:'1px solid var(--border2)',
                  color:'var(--text)', padding:'10px 12px', borderRadius:'var(--radius)',
                  fontSize:14, outline:'none',
                }}
                onFocus={e => e.target.style.borderColor='var(--accent)'}
                onBlur={e => e.target.style.borderColor='var(--border2)'}
              />
            </div>

            {error && (
              <div style={{ background:'var(--red-dim)', border:'1px solid rgba(240,82,82,0.3)',
                borderRadius:'var(--radius)', padding:'10px 12px', marginBottom:16,
                color:'var(--red)', fontSize:13 }}>
                {error}
              </div>
            )}
            {message && (
              <div style={{ background:'var(--green-dim)', border:'1px solid rgba(32,200,120,0.3)',
                borderRadius:'var(--radius)', padding:'10px 12px', marginBottom:16,
                color:'var(--green)', fontSize:13 }}>
                {message}
              </div>
            )}

            <button
              type="submit" disabled={loading}
              style={{
                width:'100%', background:'var(--accent)', color:'#fff',
                padding:'11px', borderRadius:'var(--radius)', fontSize:14,
                fontWeight:600, opacity: loading ? 0.6 : 1,
                transition:'opacity 0.15s',
              }}
            >
              {loading ? 'Please wait…' : mode === 'login' ? 'Sign in' : 'Create account'}
            </button>
          </form>

          <div style={{ textAlign:'center', marginTop:20, fontSize:13, color:'var(--text2)' }}>
            {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
            <button
              onClick={() => { setMode(mode==='login'?'signup':'login'); setError(null); setMessage(null) }}
              style={{ background:'none', color:'var(--accent)', fontWeight:500, fontSize:13 }}
            >
              {mode === 'login' ? 'Sign up' : 'Sign in'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
