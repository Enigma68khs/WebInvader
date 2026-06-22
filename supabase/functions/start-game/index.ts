import {
  getAllowedOrigins,
  getCorsHeaders,
  isAllowedOrigin,
  jsonResponse,
  readJsonBody,
} from '../_shared/http.ts'
import { signSession } from '../_shared/session.ts'

const MAX_STAGE = 8
const SESSION_TTL_MS = 60 * 60 * 1000
const MAX_REQUEST_BYTES = 128

const gameSessionSecret = Deno.env.get('GAME_SESSION_SECRET')
const allowedOrigins = getAllowedOrigins()

if (!gameSessionSecret) {
  throw new Error('Missing GAME_SESSION_SECRET')
}

type StartGamePayload = {
  startStage?: unknown
}

function normalizeStartStage(value: unknown) {
  if (typeof value !== 'number' || !Number.isInteger(value)) {
    return 1
  }

  return Math.max(1, Math.min(MAX_STAGE, value))
}

Deno.serve(async (req) => {
  const origin = req.headers.get('origin')
  const corsHeaders = getCorsHeaders(origin, allowedOrigins)

  if (req.method === 'OPTIONS') {
    if (!isAllowedOrigin(origin, allowedOrigins)) {
      return jsonResponse(403, { error: 'Origin not allowed' }, corsHeaders)
    }

    return new Response(null, { status: 204, headers: corsHeaders })
  }

  if (req.method !== 'POST') {
    return jsonResponse(405, { error: 'Method not allowed' }, corsHeaders)
  }

  if (!isAllowedOrigin(origin, allowedOrigins)) {
    return jsonResponse(403, { error: 'Origin not allowed' }, corsHeaders)
  }

  const contentType = req.headers.get('content-type') || ''
  if (!contentType.includes('application/json')) {
    return jsonResponse(415, { error: 'Content-Type must be application/json' }, corsHeaders)
  }

  const { data: payload, error: bodyError } = await readJsonBody<StartGamePayload>(
    req,
    MAX_REQUEST_BYTES,
  )

  if (bodyError === 'too_large') {
    return jsonResponse(413, { error: 'Request body too large' }, corsHeaders)
  }

  if (bodyError || !payload) {
    return jsonResponse(400, { error: 'Invalid JSON body' }, corsHeaders)
  }

  const now = Date.now()
  const session = {
    sessionId: crypto.randomUUID(),
    startStage: normalizeStartStage(payload.startStage),
    issuedAt: now,
    expiresAt: now + SESSION_TTL_MS,
  }

  return jsonResponse(
    201,
    {
      sessionToken: await signSession(session, gameSessionSecret),
      startedAt: session.issuedAt,
      expiresAt: session.expiresAt,
      startStage: session.startStage,
    },
    corsHeaders,
  )
})
