// api/health.js
// Vercel Serverless Function — available at /api/health
// Checks: API is alive, Supabase reachability, environment variables

export default async function handler(req, res) {
  const start = Date.now()

  // Only allow GET
  if (req.method !== 'GET') {
    return res.status(405).json({ status: 'error', message: 'Method not allowed' })
  }

  const checks = {}

  // 1. Basic API check
  checks.api = { status: 'ok' }

  // 2. Environment variables check
  const supabaseUrl  = process.env.VITE_SUPABASE_URL
  const supabaseKey  = process.env.VITE_SUPABASE_ANON_KEY

  checks.env = {
    status: supabaseUrl && supabaseKey ? 'ok' : 'missing',
    supabase_url:  supabaseUrl  ? 'set' : 'MISSING',
    supabase_key:  supabaseKey  ? 'set' : 'MISSING',
  }

  // 3. Supabase reachability check
  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 4000)

    const response = await fetch(`${supabaseUrl}/rest/v1/`, {
      method: 'GET',
      headers: {
        apikey: supabaseKey,
        Authorization: `Bearer ${supabaseKey}`,
      },
      signal: controller.signal,
    })
    clearTimeout(timeout)

    checks.supabase = {
      status: response.ok || response.status === 200 || response.status === 400 ? 'ok' : 'degraded',
      http_status: response.status,
      latency_ms: Date.now() - start,
    }
  } catch (err) {
    checks.supabase = {
      status: 'unreachable',
      error: err.name === 'AbortError' ? 'timeout' : err.message,
    }
  }

  // Overall status
  const allOk = Object.values(checks).every(c => c.status === 'ok')
  const anyDown = Object.values(checks).some(c => c.status === 'unreachable' || c.status === 'missing')

  const overall = anyDown ? 'unhealthy' : allOk ? 'healthy' : 'degraded'
  const httpStatus = anyDown ? 503 : allOk ? 200 : 200

  return res.status(httpStatus).json({
    status: overall,
    timestamp: new Date().toISOString(),
    uptime_ms: Date.now() - start,
    version: '1.0.0',
    app: 'AgriSmartX',
    region: process.env.VERCEL_REGION || 'unknown',
    environment: process.env.VERCEL_ENV || 'development',
    checks,
  })
}
