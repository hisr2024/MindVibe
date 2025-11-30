export async function apiFetch(path: string, options: RequestInit = {}, uid?: string){
  const url = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000') + path
  const headers = new Headers(options.headers || {})
  if (uid) headers.set('X-Auth-UID', uid)
  return fetch(url, { ...options, headers })
}
