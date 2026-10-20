import { useState } from 'react'
import { api, setToken } from './api'

export default function AuthForm({ onAuth }) {
  const [mode, setMode] = useState('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    setBusy(true)
    try {
      const path = mode === 'login' ? '/auth/login' : '/auth/signup'
      const { ok, data } = await api(path, {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      })
      if (!ok) { setError(data?.error || 'Something went wrong'); return }
      setToken(data.token)
      onAuth(data.user)
    } catch {
      setError('Could not reach the server. If it was idle, give it up to a minute to wake up, then try again.')
    } finally {
      setBusy(false)
    }
  }

  const isLogin = mode === 'login'

  return (
    <div className="auth-wrap">
      <div className="section">
        <h2>{isLogin ? 'Log in' : 'Create your account'}</h2>
        <form className="auth-form" onSubmit={submit}>
          <input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} required />
          <input type="password" placeholder="Password (8+ characters)" value={password} onChange={e => setPassword(e.target.value)} required />
          <button type="submit" disabled={busy}>{busy ? 'Please wait...' : isLogin ? 'Log in' : 'Sign up'}</button>
        </form>
        {error && <p className="error">{error}</p>}
        <p className="auth-switch">
          {isLogin ? 'New here? ' : 'Already have an account? '}
          <button type="button" className="link-btn" onClick={() => { setMode(isLogin ? 'signup' : 'login'); setError('') }}>
            {isLogin ? 'Create an account' : 'Log in'}
          </button>
        </p>
      </div>
    </div>
  )
}
