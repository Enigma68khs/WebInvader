const DEFAULT_ALLOWED_ORIGINS = new Set([
  'http://127.0.0.1:5500',
  'http://localhost:5500',
])

export function parseAllowedOrigins(value: string | undefined) {
  if (!value) {
    return new Set<string>()
  }

  return new Set(
    value
      .split(',')
      .map((origin) => origin.trim())
      .filter(Boolean),
  )
}

export function getAllowedOrigins() {
  const configured = parseAllowedOrigins(Deno.env.get('ALLOWED_ORIGINS'))
  return configured.size > 0 ? configured : DEFAULT_ALLOWED_ORIGINS
}

export function getCorsHeaders(origin: string | null, allowedOrigins = getAllowedOrigins()): HeadersInit {
  const headers: Record<string, string> = {
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    Vary: 'Origin',
  }

  if (origin && allowedOrigins.has(origin)) {
    headers['Access-Control-Allow-Origin'] = origin
  }

  return headers
}

export function isAllowedOrigin(origin: string | null, allowedOrigins = getAllowedOrigins()) {
  return Boolean(origin && allowedOrigins.has(origin))
}

export function jsonResponse(
  status: number,
  body: Record<string, unknown>,
  cors: HeadersInit,
) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...cors,
      'Content-Type': 'application/json',
    },
  })
}

export function getClientIp(req: Request) {
  const forwardedFor = req.headers.get('x-forwarded-for')
  if (forwardedFor) {
    return forwardedFor.split(',')[0]?.trim() || 'unknown'
  }

  return req.headers.get('cf-connecting-ip')?.trim() || 'unknown'
}

export function isRateLimited(
  store: Map<string, number[]>,
  key: string,
  maxAttempts: number,
  windowMs: number,
  now = Date.now(),
) {
  const recentAttempts = (store.get(key) || []).filter(
    (timestamp) => now - timestamp < windowMs,
  )

  if (recentAttempts.length >= maxAttempts) {
    store.set(key, recentAttempts)
    return true
  }

  recentAttempts.push(now)
  store.set(key, recentAttempts)
  return false
}

export async function readJsonBody<T>(
  req: Request,
  maxBytes: number,
): Promise<{ data: T | null; error: 'too_large' | 'invalid_json' | null }> {
  const contentLengthHeader = req.headers.get('content-length')
  const contentLength = contentLengthHeader ? Number(contentLengthHeader) : null
  if (contentLength !== null && Number.isFinite(contentLength) && contentLength > maxBytes) {
    return { data: null, error: 'too_large' }
  }

  try {
    const rawBody = await req.text()
    if (new TextEncoder().encode(rawBody).byteLength > maxBytes) {
      return { data: null, error: 'too_large' }
    }

    return { data: JSON.parse(rawBody) as T, error: null }
  } catch {
    return { data: null, error: 'invalid_json' }
  }
}
