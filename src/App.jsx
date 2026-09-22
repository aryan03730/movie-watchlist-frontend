import { useEffect, useState } from 'react'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5050'

export default function App() {
  const [movies, setMovies] = useState([])
  const [title, setTitle] = useState('')
  const [year, setYear] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const loadMovies = async () => {
    try {
      const res = await fetch(`${API_URL}/movies`)
      const data = await res.json()
      setMovies(data)
    } catch (e) {
      setError('Could not reach backend')
    }
  }

  useEffect(() => { loadMovies() }, [])

  const addMovie = async (e) => {
    e.preventDefault()
    setError('')
    if (!title.trim()) return
    try {
      const res = await fetch(`${API_URL}/movies`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, year: year ? parseInt(year) : null })
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Failed to add movie'); return }
      setTitle(''); setYear('')
      loadMovies()
    } catch (e) {
      setError('Could not reach backend')
    }
  }

  const toggleWatched = async (movie) => {
    await fetch(`${API_URL}/movies/${movie.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ watched: !movie.watched })
    })
    loadMovies()
  }

  const deleteMovie = async (id) => {
    await fetch(`${API_URL}/movies/${id}`, { method: 'DELETE' })
    loadMovies()
  }

  const searchTmdb = async (e) => {
    e.preventDefault()
    setError('')
    if (!searchQuery.trim()) return
    setLoading(true)
    try {
      const res = await fetch(`${API_URL}/external/search?q=${encodeURIComponent(searchQuery)}`)
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Search failed'); setSearchResults([]); return }
      setSearchResults(data.results || [])
    } catch (e) {
      setError('Could not reach backend / TMDB')
    } finally {
      setLoading(false)
    }
  }

  const importMovie = async (tmdbId) => {
    setError('')
    const res = await fetch(`${API_URL}/movies/import`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tmdb_id: tmdbId })
    })
    const data = await res.json()
    if (!res.ok) { setError(data.error || 'Import failed'); return }
    loadMovies()
  }

  return (
    <div className="container">
      <div className="hero">
        <h1>🎬 Movie Watchlist</h1>
        <p className="subtitle">Discover movies, search TMDB, and keep track of what you want to watch.</p>
      </div>

      <div className="content">
        {error && <p className="error">{error}</p>}

        <div className="section">
          <h2>Add a movie manually</h2>
          <form className="row" onSubmit={addMovie}>
            <input placeholder="Title" value={title} onChange={e => setTitle(e.target.value)} />
            <input placeholder="Year" value={year} onChange={e => setYear(e.target.value)} style={{maxWidth: 100}} />
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
                    <div className="poster-year">{m.year}</div>
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
                    {m.year && <div className="poster-year">{m.year}</div>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
