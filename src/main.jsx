import { useEffect, useMemo, useState } from 'react'
import { createRoot } from 'react-dom/client'
import './styles.css'
import { createProgressStorage, isSupabaseConfigured, supabase } from './supabase'

// `import.meta.glob` means new files placed in questionbanks/ automatically
// appear in the library without maintaining a separate list.
const bankModules = import.meta.glob('../questionbanks/*.html', {
  eager: true,
  query: '?url',
  import: 'default',
})

// JSX banks load only after they are selected. Each file should default-export
// a React component.
const jsxBankModules = import.meta.glob('../questionbanks/*.jsx')

const bankDetails = {
  frontend: { emoji: '◈', color: 'violet', description: 'HTML, CSS, JavaScript & browser fundamentals' },
  django: { emoji: '◒', color: 'orange', description: 'Python, Django & backend development' },
  devops: { emoji: '◇', color: 'blue', description: 'Cloud, CI/CD, containers & infrastructure' },
}

const titleFromSlug = (slug) => slug
  .replace(/[-_]+/g, ' ')
  .replace(/\b\w/g, (letter) => letter.toUpperCase())

const htmlBanks = Object.entries(bankModules)
  .map(([path, url]) => {
    const slug = path.split('/').pop().replace(/\.html$/, '')
    const details = bankDetails[slug] || {}
    return {
      id: `html-${slug}`,
      name: titleFromSlug(slug),
      url,
      type: 'html',
      emoji: details.emoji || '◇',
      color: details.color || 'blue',
      description: details.description || 'Curated interview questions and answers',
    }
  })

const jsxBanks = Object.entries(jsxBankModules).map(([path, loader]) => {
  const slug = path.split('/').pop().replace(/\.jsx$/, '')
  const details = bankDetails[slug] || {}
  return {
    id: `jsx-${slug}`,
    name: titleFromSlug(slug),
    loader,
    type: 'jsx',
    emoji: details.emoji || '◇',
    color: details.color || 'blue',
    description: details.description || 'Interactive React question bank',
  }
})

const banks = [...htmlBanks, ...jsxBanks].sort((a, b) => a.name.localeCompare(b.name))

function App() {
  const [selected, setSelected] = useState(null)
  const [search, setSearch] = useState('')
  const [session, setSession] = useState(null)
  const [authLoading, setAuthLoading] = useState(true)
  const [syncStatus, setSyncStatus] = useState('synced')

  useEffect(() => {
    if (!isSupabaseConfigured) { setAuthLoading(false); return undefined }
    supabase.auth.getSession().then(({ data: { session: currentSession } }) => {
      setSession(currentSession)
      setAuthLoading(false)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, nextSession) => setSession(nextSession))
    return () => subscription.unsubscribe()
  }, [])

  useEffect(() => {
    const handleSync = ({ detail }) => setSyncStatus(detail.status === 'error' ? `error:${detail.message}` : detail.status)
    window.addEventListener('questiondeck:sync', handleSync)
    return () => window.removeEventListener('questiondeck:sync', handleSync)
  }, [])

  const progressStorage = useMemo(
    () => session ? createProgressStorage(session.user.id) : null,
    [session],
  )
  const visibleBanks = useMemo(() => {
    const query = search.trim().toLowerCase()
    return query ? banks.filter((bank) => `${bank.name} ${bank.description}`.toLowerCase().includes(query)) : banks
  }, [search])

  if (authLoading) return <AuthShell><p className="auth-subtitle">Loading your learning library…</p></AuthShell>
  if (!isSupabaseConfigured) return <SetupScreen />
  if (!session) return <SignIn />

  // Existing HTML and JSX banks already use window.storage. This adapter makes
  // those calls authenticated and user-scoped without rewriting their logic.
  window.__questionDeckStorage = progressStorage
  window.storage = progressStorage

  if (selected) {
    return <Reader bank={selected} syncStatus={syncStatus} onBack={() => setSelected(null)} onSignOut={() => supabase.auth.signOut()} />
  }

  return (
    <main className="app-shell">
      <nav className="topbar">
        <button className="brand" onClick={() => setSearch('')} aria-label="Show all question banks">
          <span className="brand-mark">Q</span>
          <span>Question<span>Deck</span></span>
        </button>
        <div className="account-actions"><SyncIndicator status={syncStatus} /><div className="library-label"><span className="pulse" /> {session.user.email}</div><button className="sign-out" onClick={() => supabase.auth.signOut()}>Sign out</button></div>
      </nav>

      <section className="hero">
        <p className="eyebrow">INTERVIEW PREPARATION</p>
        <h1>Study smarter.<br /><em>Answer with confidence.</em></h1>
        <p className="intro">Your focused collection of question banks, ready whenever you are.</p>
      </section>

      <section className="library" aria-labelledby="banks-heading">
        <div className="section-heading">
          <div>
            <h2 id="banks-heading">Your question banks</h2>
            <p>{banks.length} {banks.length === 1 ? 'collection' : 'collections'} available</p>
          </div>
          <label className="search" aria-label="Search question banks">
            <span>⌕</span>
            <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search banks" />
          </label>
        </div>

        {visibleBanks.length ? (
          <div className="card-grid">
            {visibleBanks.map((bank, index) => <BankCard bank={bank} index={index} key={bank.id} onOpen={() => setSelected(bank)} />)}
          </div>
        ) : <div className="empty"><span>⌕</span><h3>No bank found</h3><p>Try a different search term.</p></div>}
      </section>
      <footer>Choose a deck to begin your practice session.</footer>
    </main>
  )
}

function BankCard({ bank, index, onOpen }) {
  return (
    <article className={`bank-card ${bank.color}`} style={{ '--delay': `${index * 70}ms` }}>
      <div className="card-top"><span className="deck-icon">{bank.emoji}</span><span className="file-type">{bank.type === 'jsx' ? 'REACT · JSX' : 'QUESTION BANK'}</span></div>
      <div className="card-copy"><h3>{bank.name}</h3><p>{bank.description}</p></div>
      <button onClick={onOpen} className="open-button">Open bank <span>→</span></button>
      <div className="orb orb-one" /><div className="orb orb-two" />
    </article>
  )
}

function Reader({ bank, onBack, onSignOut, syncStatus }) {
  return (
    <main className="reader-shell">
      <header className="reader-topbar">
        <button className="back-button" onClick={onBack}><span>←</span> All question banks</button>
        <div className="reader-title"><span className={`tiny-icon ${bank.color}`}>{bank.emoji}</span><strong>{bank.name}</strong><span className="reader-file">.{bank.type}</span></div>
        <div className="reader-actions"><SyncIndicator status={syncStatus} /><button className="sign-out reader-sign-out" onClick={onSignOut}>Sign out</button></div>
      </header>
      <section className="reader-content">
        {bank.type === 'html'
          ? <iframe title={`${bank.name} question bank`} src={bank.url} />
          : <JsxBank bank={bank} />}
      </section>
    </main>
  )
}

function SyncIndicator({ status }) {
  const isError = status.startsWith('error:')
  const label = isError ? status.replace('error:', '') : status === 'saving' ? 'Saving progress…' : 'Progress synced'
  return <span className={`sync-indicator ${isError ? 'sync-error' : status === 'saving' ? 'sync-saving' : ''}`} title={label}>{isError ? '!' : status === 'saving' ? '↻' : '✓'} {label}</span>
}

function AuthShell({ children }) {
  return <main className="auth-shell"><div className="auth-card"><div className="brand-mark">Q</div><h1>Question<span>Deck</span></h1>{children}</div></main>
}

function SignIn() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isCreatingAccount, setIsCreatingAccount] = useState(false)
  const [message, setMessage] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const submit = async (event) => {
    event.preventDefault()
    setMessage('')
    setSubmitting(true)
    const { data, error } = isCreatingAccount
      ? await supabase.auth.signUp({ email, password, options: { emailRedirectTo: window.location.origin } })
      : await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      setMessage(error.message)
    } else if (isCreatingAccount && !data.session) {
      setMessage('Account created. Confirm your email once, then sign in with your password.')
    }
    setSubmitting(false)
  }
  return <AuthShell><p className="auth-subtitle">{isCreatingAccount ? 'Create an account to keep your progress synced everywhere.' : 'Sign in to continue your synced preparation.'}</p><form onSubmit={submit}><label>Email address<input type="email" required autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" /></label><label className="password-label">Password<input type="password" required minLength="6" autoComplete={isCreatingAccount ? 'new-password' : 'current-password'} value={password} onChange={(event) => setPassword(event.target.value)} placeholder="At least 6 characters" /></label><button className="auth-button" disabled={submitting}>{submitting ? 'Please wait…' : isCreatingAccount ? 'Create account' : 'Sign in'}</button></form><button className="auth-switch" onClick={() => { setIsCreatingAccount(!isCreatingAccount); setMessage('') }}>{isCreatingAccount ? 'Already have an account? Sign in' : 'New here? Create an account'}</button>{message && <p className="auth-message">{message}</p>}</AuthShell>
}

function SetupScreen() {
  return <AuthShell><p className="auth-subtitle">Connect Supabase to enable secure, cross-device progress sync.</p><ol className="setup-list"><li>Create a Supabase project.</li><li>Run <code>supabase/schema.sql</code> in its SQL Editor.</li><li>Copy <code>.env.example</code> to <code>.env.local</code> and add the project URL and anon key.</li><li>Enable Email sign-in in Supabase Auth settings.</li></ol></AuthShell>
}

function JsxBank({ bank }) {
  const [Component, setComponent] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    let isCurrent = true
    bank.loader()
      .then((module) => {
        if (!module.default) throw new Error('No default export found')
        if (isCurrent) setComponent(() => module.default)
      })
      .catch(() => isCurrent && setError('This JSX file needs to default-export a React component.'))
    return () => { isCurrent = false }
  }, [bank])

  if (error) return <div className="jsx-message error"><strong>Unable to load this JSX bank</strong><p>{error}</p><code>export default function QuestionBank() {'{'} ... {'}'}</code></div>
  if (!Component) return <div className="jsx-message">Loading question bank…</div>
  return <div className="jsx-bank"><Component /></div>
}

createRoot(document.getElementById('root')).render(<App />)
