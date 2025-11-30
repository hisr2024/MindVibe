export async function apiFetch(path: string, options: RequestInit = {}, uid?: string){
  const baseUrl =
    process.env.NEXT_PUBLIC_API_URL ||
    process.env.INTERNAL_API_URL ||
    'http://localhost:8000'

  const url = path.startsWith('http') ? path : `${baseUrl}${path}`
  const headers = new Headers(options.headers || {})

  if (!headers.has('Accept')) {
    headers.set('Accept', 'application/json')
  }

  if (uid) headers.set('X-Auth-UID', uid)

  return fetch(url, { ...options, headers })
}
