const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5050'
const TOKEN_KEY = 'watchlist_token'

export const getToken = () => localStorage.getItem(TOKEN_KEY)
export const setToken = (token) => localStorage.setItem(TOKEN_KEY, token)
export const clearToken = () => localStorage.removeItem(TOKEN_KEY)

// App registers a callback here so an expired token sends the user back to login
let onUnauthorized = () => {}
export const setUnauthorizedHandler = (fn) => { onUnauthorized = fn }

export async function api(path, options = {}) {
  const token = getToken()
  const headers = { ...(options.headers || {}) }
  if (options.body) headers['Content-Type'] = 'application/json'
  if (token) headers['Authorization'] = `Bearer ${token}`

  const res = await fetch(`${API_URL}${path}`, { ...options, headers })

  let data = null
  try { data = await res.json() } catch { /* response had no JSON body */ }

  // Only treat 401 as "session expired" if we actually sent a token
  if (res.status === 401 && token) {
    clearToken()
    onUnauthorized()
  }
  return { ok: res.ok, status: res.status, data }
}
