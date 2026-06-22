const encoder = new TextEncoder()

export type GameSession = {
  sessionId: string
  startStage: number
  issuedAt: number
  expiresAt: number
}

function base64UrlEncode(value: Uint8Array | string) {
  const binary = typeof value === 'string'
    ? value
    : String.fromCharCode(...value)

  return btoa(binary)
    .replaceAll('+', '-')
    .replaceAll('/', '_')
    .replaceAll('=', '')
}

function base64UrlDecode(value: string) {
  const padded = value.replaceAll('-', '+').replaceAll('_', '/').padEnd(
    Math.ceil(value.length / 4) * 4,
    '=',
  )
  return atob(padded)
}

async function getSigningKey(secret: string) {
  return crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify'],
  )
}

export async function signSession(session: GameSession, secret: string) {
  const payload = base64UrlEncode(JSON.stringify(session))
  const key = await getSigningKey(secret)
  const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(payload))
  return `${payload}.${base64UrlEncode(new Uint8Array(signature))}`
}

export async function verifySessionToken(token: string, secret: string) {
  const [payload, signature] = token.split('.')
  if (!payload || !signature) {
    return null
  }

  const key = await getSigningKey(secret)
  const signatureBytes = Uint8Array.from(base64UrlDecode(signature), (char) => char.charCodeAt(0))
  const isValid = await crypto.subtle.verify(
    'HMAC',
    key,
    signatureBytes,
    encoder.encode(payload),
  )

  if (!isValid) {
    return null
  }

  try {
    const parsed = JSON.parse(base64UrlDecode(payload)) as GameSession
    if (
      typeof parsed.sessionId !== 'string' ||
      typeof parsed.startStage !== 'number' ||
      typeof parsed.issuedAt !== 'number' ||
      typeof parsed.expiresAt !== 'number'
    ) {
      return null
    }

    return parsed
  } catch {
    return null
  }
}
