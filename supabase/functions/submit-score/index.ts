import { createClient } from 'npm:@supabase/supabase-js@2'
import {
  getAllowedOrigins,
  getClientIp,
  getCorsHeaders,
  isAllowedOrigin,
  isRateLimited,
  jsonResponse,
  readJsonBody,
} from '../_shared/http.ts'
import { verifySessionToken } from '../_shared/session.ts'

const TABLE_NAME = 'leaderboard_scores'
const MAX_NAME_LENGTH = 12
const MAX_STAGE = 8
const MAX_SCORE = 10000
const MAX_REQUEST_BYTES = 2048
const RATE_LIMIT_WINDOW_MS = 60_000
const MAX_SUBMISSIONS_PER_WINDOW = 10
const MIN_SUBMISSION_ELAPSED_MS = 12_000

const supabaseUrl = Deno.env.get('SUPABASE_URL')
const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
const gameSessionSecret = Deno.env.get('GAME_SESSION_SECRET')
const allowedOrigins = getAllowedOrigins()
const rateLimitStore = new Map<string, number[]>()

if (!supabaseUrl || !serviceRoleKey || !gameSessionSecret) {
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
  sessionToken?: unknown
  elapsedMs?: unknown
}

type InsertedScore = {
  id: number
  created_at: string
}

const stageFormations = [
  [
    '0001111000',
    '0011111100',
    '0111111110',
    '1110011111',
    '1100000011',
  ],
  [
    '1111111111',
    '1100000011',
    '1110110111',
    '1100000011',
    '1111111111',
  ],
  [
    '1000000001',
    '1100000011',
    '1110000111',
    '1111001111',
    '1111111111',
  ],
  [
    '1100110011',
    '1111111111',
    '0111111110',
    '0011111100',
    '0001111000',
  ],
  [
    '1011001101',
    '0111111110',
    '0011111100',
    '0111111110',
    '1011001101',
  ],
  [
    '1110011111',
    '1111111111',
    '0111111110',
    '1111111111',
    '1110011111',
  ],
  [
    '1111111111',
    '1110110111',
    '1111111111',
    '1101111011',
    '1111111111',
  ],
  [
    '1111111111',
    '1110011111',
    '1111111111',
    '1110011111',
    '1111111111',
  ],
]

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

function normalizeElapsedMs(value: unknown) {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    return null
  }

  return Math.max(0, Math.floor(value))
}

function getRegularEnemyScore(stageNumber: number) {
  const formation = stageFormations[stageNumber - 1] || stageFormations[stageFormations.length - 1]
  return formation.join('').split('').filter((cell) => cell === '1').length * 10
}

function getSpecialSpawnCount(stageNumber: number) {
  return Math.min(7, 1 + Math.floor(stageNumber * 0.9))
}

function getSpecialEnemyMaxHealth(stageNumber: number) {
  return 2 + stageNumber + Math.floor(stageNumber / 3)
}

function getMaxSpecialEnemyScore(stageNumber: number) {
  const difficultyBonus = 30 + stageNumber * 8
  const durabilityBonus = getSpecialEnemyMaxHealth(stageNumber) * 4
  const randomBonusCap = 8 + stageNumber * 4
  return difficultyBonus + durabilityBonus + randomBonusCap
}

function getMaxScoreForStartStage(startStage: number) {
  let maxScore = 0

  for (let stage = startStage; stage <= MAX_STAGE; stage++) {
    maxScore += getRegularEnemyScore(stage)
    maxScore += getSpecialSpawnCount(stage) * getMaxSpecialEnemyScore(stage)
  }

  maxScore += 1600
  return Math.min(MAX_SCORE, Math.ceil(maxScore * 1.05))
}

function isPlausibleSubmission(score: number, startStage: number, elapsedMs: number) {
  if (startStage < 1 || startStage > MAX_STAGE) {
    return false
  }

  if (elapsedMs < MIN_SUBMISSION_ELAPSED_MS) {
    return false
  }

  return score <= getMaxScoreForStartStage(startStage)
}

async function getRank(score: number, createdAt: string, id: number) {
  const [
    { count: higherCount, error: higherError },
    { count: earlierTieCount, error: earlierTieError },
    { count: sameTimeTieCount, error: sameTimeTieError },
  ] = await Promise.all([
    supabaseAdmin
      .from(TABLE_NAME)
      .select('id', { count: 'exact', head: true })
      .gt('score', score),
    supabaseAdmin
      .from(TABLE_NAME)
      .select('id', { count: 'exact', head: true })
      .eq('score', score)
      .lt('created_at', createdAt),
    supabaseAdmin
      .from(TABLE_NAME)
      .select('id', { count: 'exact', head: true })
      .eq('score', score)
      .eq('created_at', createdAt)
      .lt('id', id),
  ])

  if (higherError || earlierTieError || sameTimeTieError) {
    console.error('submit-score rank failed', higherError || earlierTieError || sameTimeTieError)
    return null
  }

  return (higherCount ?? 0) + (earlierTieCount ?? 0) + (sameTimeTieCount ?? 0) + 1
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

  const clientIp = getClientIp(req)
  if (isRateLimited(rateLimitStore, clientIp, MAX_SUBMISSIONS_PER_WINDOW, RATE_LIMIT_WINDOW_MS)) {
    return jsonResponse(429, { error: 'Too many submissions. Please try again later.' }, corsHeaders)
  }

  const { data: payload, error: bodyError } = await readJsonBody<SubmissionPayload>(
    req,
    MAX_REQUEST_BYTES,
  )

  if (bodyError === 'too_large') {
    return jsonResponse(413, { error: 'Request body too large' }, corsHeaders)
  }

  if (bodyError || !payload) {
    return jsonResponse(400, { error: 'Invalid JSON body' }, corsHeaders)
  }

  const playerName = normalizePlayerName(payload.playerName)
  const score = normalizeScore(payload.score)
  const elapsedMs = normalizeElapsedMs(payload.elapsedMs)
  const sessionToken = typeof payload.sessionToken === 'string' ? payload.sessionToken : ''
  const session = await verifySessionToken(sessionToken, gameSessionSecret)
  const now = Date.now()

  if (!playerName || score === null || elapsedMs === null || !session) {
    return jsonResponse(400, { error: 'Invalid score payload' }, corsHeaders)
  }

  if (session.expiresAt < now || session.issuedAt > now + 10_000) {
    return jsonResponse(400, { error: 'Expired game session' }, corsHeaders)
  }

  if (!isPlausibleSubmission(score, session.startStage, elapsedMs)) {
    return jsonResponse(400, { error: 'Implausible score payload' }, corsHeaders)
  }

  const { data: inserted, error } = await supabaseAdmin
    .from(TABLE_NAME)
    .insert([{ player_name: playerName, score }])
    .select('id, created_at')
    .single()

  const insertedScore = inserted as InsertedScore | null

  if (error || !insertedScore) {
    console.error('submit-score insert failed', error)
    return jsonResponse(500, { error: 'Failed to store score' }, corsHeaders)
  }

  return jsonResponse(
    201,
    {
      ok: true,
      playerName,
      score,
      rank: await getRank(score, insertedScore.created_at, insertedScore.id),
      id: insertedScore.id,
      createdAt: insertedScore.created_at,
    },
    corsHeaders,
  )
})
