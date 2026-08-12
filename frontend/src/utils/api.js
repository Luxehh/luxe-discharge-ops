const API_URL = String(import.meta.env.VITE_API_URL || '')
  .trim()
  .replace(/\/$/, '')

export function getApiUrl() {
  return API_URL
}

function getToken() {
  return localStorage.getItem('token')
}

export async function apiRequest(path, options = {}) {
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  }

  const token = getToken()
  if (token) {
    headers.Authorization = `Bearer ${token}`
  }

  const normalizedPath = path.startsWith('/') ? path : `/${path}`
  const res = await fetch(`${API_URL}${normalizedPath}`, {
    ...options,
    headers,
  })

  const data = await res.json().catch(() => ({}))

  if (!res.ok) {
    throw new Error(data.message || 'Request failed')
  }

  return data
}
