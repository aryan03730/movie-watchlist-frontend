import { useEffect, useState } from 'react'
import AuthForm from './AuthForm'
import { api, getToken, clearToken, setUnauthorizedHandler } from './api'

const USER_KEY = 'watchlist_user'

function readSavedUser() {
  try { return JSON.parse(localStorage.getItem(USER_KEY)) } catch { return null }
}

export default function App() {
  const [user, setUser] = useState(() => (getToken() ? readSavedUser() : null))
  const [movies, setMovies] = useState([])
  const [title, setTitle] = useState('')
  const [year, setYear] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [recs, setRecs] = useState([])
  const [recsLoading, setRecsLoading] = useState(false)
  const [recsMsg, setRecsMsg] = useState('')
  // Only changes when the set of TMDB movies in the watchlist changes (not on watched toggles)
  const tmdbKey = movies.map(m => m.tmdb_id).filter(Boolean).join(',')

  const logout = () => {
    clearToken()
    localStorage.removeItem(USER_KEY)
    setUser(null)
    setMovies([])
    setRecs([])
    setSearchResults([])
    setError('')
  }

  // If the API ever answers 401 to a request that carried a token, log out
  useEffect(() => { setUnauthorizedHandler(logout) }, [])

  const handleAuth = (u) => {
    localStorage.setItem(USER_KEY, JSON.stringify(u))
    setUser(u)
  }

  // 401s are handled by logout, so don't show an error for them
  const fail = (res, fallback) => {
    if (res.status === 401) return
    setError(res.data?.error || fallback)
  }

  const loadMovies = async () => {
    try {
      const res = await api('/movies')
      if (res.ok) setMovies(res.data)
      else fail(res, 'Could not load your watchlist')
    } catch {
      setError('Could not reach backend')
    }
  }

  useEffect(() => { if (user) loadMovies() }, [user])

  // Reload recommendations whenever the watchlist's TMDB movies change
  useEffect(() => {
    if (!user) return
    if (!tmdbKey) { setRecs([]); setRecsMsg(''); setRecsLoading(false); return }
    let cancelled = false  // ignore a slow response if the watchlist changed again meanwhile
    setRecsLoading(true)
    ;(async () => {
      try {
        const res = await api('/recommendations')
        if (cancelled) return
        if (res.ok) { setRecs(res.data.results || []); setRecsMsg('') }
        else if (res.status !== 401) { setRecs([]); setRecsMsg('Recommendations are unavailable right now.') }
      } catch {
        if (!cancelled) { setRecs([]); setRecsMsg('Recommendations are unavailable right now.') }
      } finally {
        if (!cancelled) setRecsLoading(false)
      }
    })()
    return () => { cancelled = true }
  }, [user, tmdbKey])

  const addMovie = async (e) => {
    e.preventDefault()
    setError('')
    if (!title.trim()) return
    try {
      const res = await api('/movies', {
        method: 'POST',
        body: JSON.stringify({ title, year: year ? parseInt(year, 10) : null }),
      })
      if (!res.ok) { fail(res, 'Failed to add movie'); return }
      setTitle(''); setYear('')
      loadMovies()
    } catch {
      setError('Could not reach backend')
    }
  }

  const toggleWatched = async (movie) => {
    setError('')
    try {
      const res = await api(`/movies/${movie.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ watched: !movie.watched }),
      })
      if (!res.ok) { fail(res, 'Could not update movie'); return }
      loadMovies()
    } catch {
      setError('Could not reach backend')
    }
  }

  const deleteMovie = async (id) => {
    setError('')
    try {
      const res = await api(`/movies/${id}`, { method: 'DELETE' })
      if (!res.ok) { fail(res, 'Could not delete movie'); return }
      loadMovies()
    } catch {
      setError('Could not reach backend')
    }
  }

  const searchTmdb = async (e) => {
    e.preventDefault()
    setError('')
    if (!searchQuery.trim()) return
    setLoading(true)
    try {
      const res = await api(`/external/search?q=${encodeURIComponent(searchQuery)}`)
      if (!res.ok) { fail(res, 'Search failed'); setSearchResults([]); return }
      setSearchResults(res.data.results || [])
    } catch {
      setError('Could not reach backend / TMDB')
    } finally {
      setLoading(false)
    }
  }

  const importMovie = async (tmdbId) => {
    setError('')
    try {
      const res = await api('/movies/import', {
        method: 'POST',
        body: JSON.stringify({ tmdb_id: tmdbId }),
      })
      if (!res.ok) { fail(res, 'Import failed'); return }
      loadMovies()
    } catch {
      setError('Could not reach backend')
    }
  }

  const hero = (
    <div className="hero">
      <h1>🎬 Movie Watchlist</h1>
      <p className="subtitle">Discover movies, search TMDB, and keep track of what you want to watch.</p>
    </div>
  )

  if (!user) {
    return (
      <div className="container">
        {hero}
        <div className="content">
          <AuthForm onAuth={handleAuth} />
        </div>
      </div>
    )
  }

  return (
    <div className="container">
      {hero}

      <div className="content">
        <div className="userbar">
          <span>{user.email}</span>
          <button onClick={logout}>Log out</button>
        </div>

        {error && <p className="error">{error}</p>}

        <div className="section">
          <h2>Add a movie manually</h2>
          <form className="row" onSubmit={addMovie}>
            <input placeholder="Title" value={title} onChange={e => setTitle(e.target.value)} />
            <input placeholder="Year" value={year} onChange={e => setYear(e.target.value)} style={{ maxWidth: 100 }} />
            <button type="submit">Add</button>
          </form>
        </div>

        <div className="section">
          <h2>Search TMDB</h2>
          <form className="row" onSubmit={searchTmdb}>
            <input placeholder="Search movies..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
            <button type="submit" disabled={loading}>{loading ? 'Searching...' : 'Search'}</button>
          </form>
          {searchResults.length > 0 && (
            <div className="grid">
              {searchResults.map(m => (
                <div className="poster-card" key={m.tmdb_id}>
                  {m.poster_path ? (
                    <img src={m.poster_path} alt={m.title} />
                  ) : (
                    <div className="poster-placeholder-big">🎥</div>
                  )}
                  <div className="poster-actions">
                    <button className="icon-btn" title="Add to watchlist" onClick={() => importMovie(m.tmdb_id)}>+</button>
                  </div>
                  <div className="poster-overlay">
                    <div className="poster-title">{m.title}</div>
                    {m.year && m.year !== '0000' && <div className="poster-year">{m.year}</div>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="section">
          <h2>Your Watchlist ({movies.length})</h2>
          {movies.length === 0 && <p className="empty">No movies yet — add one above.</p>}
          {movies.length > 0 && (
            <div className="grid">
              {movies.map(m => (
                <div className="poster-card" key={m.id}>
                  {m.poster_path ? (
                    <img src={m.poster_path} alt={m.title} />
                  ) : (
                    <div className="poster-placeholder-big">🎬</div>
                  )}
                  {m.watched && <div className="watched-badge">✓ Watched</div>}
                  <div className="poster-actions">
                    <button className="icon-btn" title={m.watched ? 'Mark unwatched' : 'Mark watched'} onClick={() => toggleWatched(m)}>
                      {m.watched ? '↺' : '✓'}
                    </button>
                    <button className="icon-btn danger" title="Delete" onClick={() => deleteMovie(m.id)}>×</button>
                  </div>
                  <div className="poster-overlay">
                    <div className="poster-title">{m.title}</div>
                    {m.year ? <div className="poster-year">{m.year}</div> : null}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {tmdbKey && (
          <div className="section">
            <h2>Recommended for you</h2>
            {recsLoading && recs.length === 0 && <p className="empty">Finding recommendations…</p>}
            {recsMsg && <p className="empty">{recsMsg}</p>}
            {recs.length > 0 && (
              <div className="grid">
                {recs.map(m => (
                  <div
                    className="poster-card"
                    key={m.tmdb_id}
                    title={m.because?.length ? `Because you added ${m.because.join(', ')}` : undefined}
                  >
                    {m.poster_path ? (
                      <img src={m.poster_path} alt={m.title} />
                    ) : (
                      <div className="poster-placeholder-big">🎥</div>
                    )}
                    <div className="poster-actions">
                      <button className="icon-btn" title="Add to watchlist" onClick={() => importMovie(m.tmdb_id)}>+</button>
                    </div>
                    <div className="poster-overlay">
                      <div className="poster-title">{m.title}</div>
                      {m.year && m.year !== '0000' && <div className="poster-year">{m.year}</div>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
