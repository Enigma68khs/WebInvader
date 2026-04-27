import { createClient } from 'npm:@supabase/supabase-js@2'

const TABLE_NAME = 'leaderboard_scores'
const MAX_NAME_LENGTH = 12
const MAX_SCORE = 10000
const MAX_REQUEST_BYTES = 256
const RATE_LIMIT_WINDOW_MS = 60_000
const MAX_SUBMISSIONS_PER_WINDOW = 10

const supabaseUrl = Deno.env.get('SUPABASE_URL')
const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
const configuredAllowedOrigins = parseAllowedOrigins(Deno.env.get('ALLOWED_ORIGINS'))
const allowedOrigins = configuredAllowedOrigins.size > 0
  ? configuredAllowedOrigins
  : new Set([
      'http://127.0.0.1:5500',
      'http://localhost:5500',
    ])
const rateLimitStore = new Map<string, number[]>()

if (!supabaseUrl || !serviceRoleKey) {
  throw new Error('Missing Supabase function environment variables')
}

const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})

type SubmissionPayload = {
  playerName?: unknown
  score?: unknown
}

function parseAllowedOrigins(value: string | undefined) {
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

function getCorsHeaders(origin: string | null): HeadersInit {
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

function isAllowedOrigin(origin: string | null) {
  return Boolean(origin && allowedOrigins.has(origin))
}

function jsonResponse(
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

function normalizePlayerName(value: unknown) {
  if (typeof value !== 'string') {
    return null
  }

  const normalized = value.normalize('NFKC').replace(/\s+/gu, ' ').trim()
  const characters = Array.from(normalized)
  const truncated = characters.slice(0, MAX_NAME_LENGTH).join('')

  if (!truncated || !/^[\p{L}\p{N} _-]+$/u.test(truncated)) {
    return null
  }

  return truncated
}

function normalizeScore(value: unknown) {
  if (typeof value !== 'number' || !Number.isInteger(value)) {
    return null
  }

  if (value <= 0 || value > MAX_SCORE) {
    return null
  }

  return value
}

function getClientIp(req: Request) {
  const forwardedFor = req.headers.get('x-forwarded-for')
  if (forwardedFor) {
    return forwardedFor.split(',')[0]?.trim() || 'unknown'
  }

  return req.headers.get('cf-connecting-ip')?.trim() || 'unknown'
}

function isRateLimited(clientIp: string, now = Date.now()) {
  const recentAttempts = (rateLimitStore.get(clientIp) || []).filter(
    (timestamp) => now - timestamp < RATE_LIMIT_WINDOW_MS,
  )

  if (recentAttempts.length >= MAX_SUBMISSIONS_PER_WINDOW) {
    rateLimitStore.set(clientIp, recentAttempts)
    return true
  }

  recentAttempts.push(now)
  rateLimitStore.set(clientIp, recentAttempts)
  return false
}

Deno.serve(async (req) => {
  const origin = req.headers.get('origin')
  const corsHeaders = getCorsHeaders(origin)

  if (req.method === 'OPTIONS') {
    if (!isAllowedOrigin(origin)) {
      return jsonResponse(403, { error: 'Origin not allowed' }, corsHeaders)
    }

    return new Response(null, { status: 204, headers: corsHeaders })
  }

  if (req.method !== 'POST') {
    return jsonResponse(405, { error: 'Method not allowed' }, corsHeaders)
  }

  if (!isAllowedOrigin(origin)) {
    return jsonResponse(403, { error: 'Origin not allowed' }, corsHeaders)
  }

  const contentType = req.headers.get('content-type') || ''
  if (!contentType.includes('application/json')) {
    return jsonResponse(415, { error: 'Content-Type must be application/json' }, corsHeaders)
  }

  const contentLengthHeader = req.headers.get('content-length')
  const contentLength = contentLengthHeader ? Number(contentLengthHeader) : null
  if (contentLength !== null && Number.isFinite(contentLength) && contentLength > MAX_REQUEST_BYTES) {
    return jsonResponse(413, { error: 'Request body too large' }, corsHeaders)
  }

  const clientIp = getClientIp(req)
  if (isRateLimited(clientIp)) {
    return jsonResponse(429, { error: 'Too many submissions. Please try again later.' }, corsHeaders)
  }

  let payload: SubmissionPayload

  try {
    const rawBody = await req.text()
    if (new TextEncoder().encode(rawBody).byteLength > MAX_REQUEST_BYTES) {
      return jsonResponse(413, { error: 'Request body too large' }, corsHeaders)
    }

    payload = JSON.parse(rawBody)
  } catch {
    return jsonResponse(400, { error: 'Invalid JSON body' }, corsHeaders)
  }

  const playerName = normalizePlayerName(payload.playerName)
  const score = normalizeScore(payload.score)

  if (!playerName || score === null) {
    return jsonResponse(400, { error: 'Invalid score payload' }, corsHeaders)
  }

  const { error } = await supabaseAdmin
    .from(TABLE_NAME)
    .insert([{ player_name: playerName, score }])

  if (error) {
    console.error('submit-score insert failed', error)
    return jsonResponse(500, { error: 'Failed to store score' }, corsHeaders)
  }

  return jsonResponse(
    201,
    {
      ok: true,
      playerName,
      score,
    },
    corsHeaders,
  )
})
