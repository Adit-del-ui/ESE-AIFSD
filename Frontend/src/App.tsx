import { useState } from 'react'
import RegisterForm from './components/RegisterForm'
import ComplaintList from './components/ComplaintList'
import StatusUpdate from './components/StatusUpdate'
import AIAnalysis from './components/AIAnalysis'
import Auth from './components/Auth'
import './style.css'

type View = 'home' | 'register' | 'list' | 'update' | 'ai' | 'auth'

export default function App() {
  const [view, setView] = useState<View>('home')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [logged, setLogged] = useState(!!localStorage.getItem('token'))

  function getEmail(): string {
    const token = localStorage.getItem('token')
    if (!token) return ''
    try {
      const payload = JSON.parse(atob(token.split('.')[1]))
      return payload.email || ''
    } catch { return '' }
  }

  function logout() {
    localStorage.removeItem('token')
    setLogged(false)
    setView('home')
  }

  const nav = (v: View) => () => setView(v)

  return (
    <div id="app-root">
      {/* ── Navigation ─── */}
      <header className="nav">
        <div className="nav-brand" onClick={nav('home')}>
          <div className="brand-icon">🏛️</div>
          CivicAlert
        </div>

        <nav className="nav-links">
          <button className={`nav-btn ${view==='home' ? 'active' : ''}`} onClick={nav('home')}>
            <span className="nav-icon">🏠</span> Home
          </button>
          <button className={`nav-btn ${view==='register' ? 'active' : ''}`} onClick={nav('register')}>
            <span className="nav-icon">📝</span> Register
          </button>
          <button className={`nav-btn ${view==='list' ? 'active' : ''}`} onClick={nav('list')}>
            <span className="nav-icon">📋</span> Complaints
          </button>
          <button className={`nav-btn ${view==='ai' ? 'active' : ''}`} onClick={nav('ai')}>
            <span className="nav-icon">🤖</span> AI Analyze
          </button>
        </nav>

        <div className="nav-actions">
          {logged ? (
            <>
              <div className="nav-user-badge">
                <span className="user-dot" />
                {getEmail()}
              </div>
              <button className="btn btn-ghost btn-sm" onClick={logout}>Logout</button>
            </>
          ) : (
            <button className="btn btn-primary btn-sm" onClick={nav('auth')}>
              Sign In
            </button>
          )}
        </div>
      </header>

      <div className="glow-line" />

      {/* ── Content ─── */}
      <main>
        {view === 'home' && <HomePage onNavigate={setView} logged={logged} />}
        {view === 'register' && <RegisterForm />}
        {view === 'list' && (
          <ComplaintList onEdit={(id) => { setSelectedId(id); setView('update') }} />
        )}
        {view === 'update' && selectedId && (
          <StatusUpdate id={selectedId} onDone={() => setView('list')} />
        )}
        {view === 'ai' && <AIAnalysis />}
        {view === 'auth' && <Auth onAuth={() => { setLogged(true); setView('list') }} />}
      </main>
    </div>
  )
}

/* ── Home / Landing page ──────────────────── */
function HomePage({ onNavigate, logged }: { onNavigate: (v: View) => void; logged: boolean }) {
  return (
    <div className="page" style={{ textAlign: 'center', paddingTop: 80 }}>
      {/* Hero */}
      <div style={{ marginBottom: 64, animation: 'fadeUp 0.5s ease' }}>
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 8,
          background: 'var(--accent-bg)', border: '1px solid rgba(99,102,241,0.25)',
          borderRadius: 100, padding: '6px 14px', marginBottom: 28,
          fontSize: 13, fontWeight: 600, color: 'var(--accent-2)'
        }}>
          🤖 Powered by AI · Smart Routing · Real-time Tracking
        </div>

        <h1 style={{
          fontSize: 'clamp(36px, 6vw, 72px)', fontWeight: 800,
          lineHeight: 1.1, letterSpacing: '-0.04em', marginBottom: 20,
          background: 'linear-gradient(135deg, #f1f5f9 30%, #818cf8 70%, #14b8a6)',
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent'
        }}>
          Smart Complaint<br />Management System
        </h1>

        <p style={{ fontSize: 18, color: 'var(--text)', maxWidth: 560, margin: '0 auto 36px', lineHeight: 1.7 }}>
          Register complaints, get instant AI analysis, track resolution status —
          all in one intelligent platform.
        </p>

        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
          <button className="btn btn-primary btn-lg" onClick={() => onNavigate('register')}>
            📝 Register Complaint
          </button>
          {!logged && (
            <button className="btn btn-secondary btn-lg" onClick={() => onNavigate('auth')}>
              🔐 Admin Login
            </button>
          )}
          {logged && (
            <button className="btn btn-secondary btn-lg" onClick={() => onNavigate('list')}>
              📋 View All Complaints
            </button>
          )}
        </div>
      </div>

      {/* Feature cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: 16, maxWidth: 900, margin: '0 auto',
        animation: 'fadeUp 0.6s ease 0.1s both'
      }}>
        {[
          { icon: '📝', title: 'Easy Registration', desc: 'Submit complaints in seconds with structured form fields.' },
          { icon: '🤖', title: 'AI Analysis', desc: 'Automatic priority detection, department routing & response generation.' },
          { icon: '📍', title: 'Location Tracking', desc: 'Search and filter complaints by location & category.' },
          { icon: '🔒', title: 'Secure Auth', desc: 'JWT-based authentication with bcrypt password hashing.' },
        ].map(f => (
          <div key={f.title} className="card card-glass" style={{ textAlign: 'left', cursor: 'default' }}>
            <div style={{ fontSize: 32, marginBottom: 12 }}>{f.icon}</div>
            <h3 style={{ fontSize: 16, marginBottom: 8, color: 'var(--text-h)' }}>{f.title}</h3>
            <p style={{ fontSize: 14, color: 'var(--text-2)', lineHeight: 1.6 }}>{f.desc}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
