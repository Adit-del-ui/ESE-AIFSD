import React, { useState } from 'react'

const API_BASE = (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/$/, '') ?? ''

const EXAMPLES = [
  { label: 'Water Leak', text: 'Water pipeline is severely damaged near the main market area in Ghaziabad. Water is flooding the street and causing major disruption to pedestrians and traffic.' },
  { label: 'Power Outage', text: 'Electricity has been out for 12 hours in Sector 5. Multiple transformers are down. This is a critical emergency affecting hospitals and residences.' },
  { label: 'Garbage', text: 'Garbage has not been collected for 3 days in our locality. The dumping area near Block B is overflowing and causing hygiene issues for residents.' },
]

type AIResult = {
  priority?: string
  department?: string
  summary?: string
  autoResponse?: string
}

export default function AIAnalysis() {
  const [text, setText] = useState('')
  const [result, setResult] = useState<AIResult | null>(null)
  const [raw, setRaw] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showRaw, setShowRaw] = useState(false)

  async function analyze(e: React.FormEvent) {
    e.preventDefault()
    if (!text.trim()) return
    setLoading(true); setResult(null); setError(null); setRaw(null)
    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' }
      const token = localStorage.getItem('token')
      if (token) headers['Authorization'] = 'Bearer ' + token
      const res = await fetch(API_BASE + '/api/ai/analyze', {
        method: 'POST', headers, body: JSON.stringify({ text })
      })
      const data = await res.json()
      const r: AIResult = data.result || data.fallback || {}
      setResult(r)
      setRaw(JSON.stringify(data, null, 2))
    } catch (err: any) {
      setError('Error: ' + (err.message || String(err)))
    } finally { setLoading(false) }
  }

  const priority = result?.priority?.toLowerCase() || 'low'

  return (
    <div className="page" style={{ maxWidth: 900 }}>
      <div className="page-header">
        <h1 className="page-title">🤖 AI Complaint Analyzer</h1>
        <p className="page-subtitle">
          Paste complaint text to detect priority, suggest department, generate a summary, and auto-draft a response.
        </p>
      </div>

      {/* Quick examples */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
        <span style={{ fontSize: 13, color: 'var(--text-2)', alignSelf: 'center' }}>Try example:</span>
        {EXAMPLES.map(ex => (
          <button key={ex.label} className="btn btn-ghost btn-sm" onClick={() => setText(ex.text)}>
            {ex.label}
          </button>
        ))}
      </div>

      {/* Input card */}
      <div className="card" style={{ marginBottom: 20 }}>
        <form onSubmit={analyze} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div className="form-group">
            <label className="form-label" htmlFor="ai-text">Complaint Text</label>
            <textarea
              id="ai-text"
              className="form-textarea"
              placeholder="Enter the full complaint description here to get AI-powered analysis..."
              value={text}
              onChange={e => setText(e.target.value)}
              rows={6}
            />
          </div>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <button type="submit" className="btn btn-primary" disabled={loading || !text.trim()}>
              {loading ? <><span className="spinner" /> Analyzing...</> : '🔍 Analyze Complaint'}
            </button>
            {text && <button type="button" className="btn btn-ghost btn-sm" onClick={() => { setText(''); setResult(null); setRaw(null) }}>Clear</button>}
            <span style={{ marginLeft: 'auto', fontSize: 13, color: 'var(--text-2)' }}>
              {text.length} characters
            </span>
          </div>
        </form>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {/* Results */}
      {result && (
        <div style={{ animation: 'fadeUp 0.4s ease' }}>
          <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-h)', marginBottom: 16 }}>
            ✨ Analysis Results
          </h3>

          {/* Top row: Priority + Department */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14, marginBottom: 14 }}>
            {/* Priority card */}
            <div className="card card-sm" style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 40, marginBottom: 8 }}>
                {priority === 'high' ? '🚨' : priority === 'medium' ? '⚠️' : '✅'}
              </div>
              <div style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-2)', marginBottom: 8 }}>
                Priority Level
              </div>
              <span className={`badge badge-${priority}`} style={{ fontSize: 14, padding: '6px 16px' }}>
                {result.priority || 'Low'}
              </span>
            </div>

            {/* Department card */}
            <div className="card card-sm" style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 40, marginBottom: 8 }}>🏢</div>
              <div style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-2)', marginBottom: 8 }}>
                Responsible Department
              </div>
              <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--text-h)' }}>
                {result.department || '—'}
              </div>
            </div>
          </div>

          {/* Summary */}
          {result.summary && (
            <div className="card card-sm" style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--teal)', marginBottom: 10 }}>
                📄 AI Summary
              </div>
              <p style={{ fontSize: 15, color: 'var(--text-h)', lineHeight: 1.7 }}>{result.summary}</p>
            </div>
          )}

          {/* Auto-response */}
          {result.autoResponse && (
            <div className="ai-auto-response" style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8, opacity: 0.8 }}>
                💬 Auto-Generated Response to Citizen
              </div>
              <p style={{ fontSize: 15, margin: 0, lineHeight: 1.7 }}>{result.autoResponse}</p>
            </div>
          )}

          {/* Raw JSON toggle */}
          {raw && (
            <div>
              <button className="btn btn-ghost btn-sm" onClick={() => setShowRaw(v => !v)} style={{ marginBottom: 8 }}>
                {showRaw ? '▲ Hide' : '▼ Show'} Raw JSON Response
              </button>
              {showRaw && <pre className="code-block">{raw}</pre>}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
