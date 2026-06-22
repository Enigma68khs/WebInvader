import { createClient } from 'npm:@supabase/supabase-js@2'
import {
  getAllowedOrigins,
  getClientIp,
  getCorsHeaders,
  isAllowedOrigin,
  isRateLimited,
  jsonResponse,
} from '../_shared/http.ts'

const TABLE_NAME = 'site_visits'
const RATE_LIMIT_WINDOW_MS = 60_000
const MAX_VISITS_PER_WINDOW = 60

const supabaseUrl = Deno.env.get('SUPABASE_URL')
const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
const visitSalt = Deno.env.get('VISIT_SALT') || serviceRoleKey
const allowedOrigins = getAllowedOrigins()
const rateLimitStore = new Map<string, number[]>()

if (!supabaseUrl || !serviceRoleKey || !visitSalt) {
  throw new Error('Missing Supabase visit function environment variables')
}

const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})

function getVisitDateString(date = new Date()) {
  return date.toISOString().slice(0, 10)
}

function formatUuidFromHex(hex: string) {
  const chars = hex.slice(0, 32).split('')
  chars[12] = '4'
  chars[16] = ((Number.parseInt(chars[16], 16) & 0x3) | 0x8).toString(16)
  const uuidHex = chars.join('')

  return `${uuidHex.slice(0, 8)}-${uuidHex.slice(8, 12)}-${uuidHex.slice(12, 16)}-${uuidHex.slice(16, 20)}-${uuidHex.slice(20, 32)}`
}

async function getVisitorId(req: Request, visitDate: string) {
  const ip = getClientIp(req)
  const userAgent = req.headers.get('user-agent') || 'unknown'
  const material = `${visitSalt}:${visitDate}:${ip}:${userAgent}`
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(material))
  const hex = Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('')

  return formatUuidFromHex(hex)
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

  const clientIp = getClientIp(req)
  if (isRateLimited(rateLimitStore, clientIp, MAX_VISITS_PER_WINDOW, RATE_LIMIT_WINDOW_MS)) {
    return jsonResponse(429, { error: 'Too many visit requests' }, corsHeaders)
  }

  const visitDate = getVisitDateString()
  const visitorId = await getVisitorId(req, visitDate)

  const { error: insertError } = await supabaseAdmin
    .from(TABLE_NAME)
    .insert({
      visit_date: visitDate,
      visitor_id: visitorId,
    })

  if (insertError && insertError.code !== '23505') {
    console.error('record-visit insert failed', insertError)
    return jsonResponse(500, { error: 'Failed to record visit' }, corsHeaders)
  }

  const [todayResult, totalResult] = await Promise.all([
    supabaseAdmin
      .from(TABLE_NAME)
      .select('visitor_id', { count: 'exact', head: true })
      .eq('visit_date', visitDate),
    supabaseAdmin
      .from(TABLE_NAME)
      .select('visitor_id', { count: 'exact', head: true }),
  ])

  if (todayResult.error || totalResult.error) {
    console.error('record-visit count failed', todayResult.error || totalResult.error)
    return jsonResponse(500, { error: 'Failed to load visit stats' }, corsHeaders)
  }

  return jsonResponse(
    200,
    {
      today: todayResult.count ?? null,
      total: totalResult.count ?? null,
    },
    corsHeaders,
  )
})
