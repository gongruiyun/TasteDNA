import https from 'node:https'

const ARK_API_KEY = process.env.ARK_API_KEY ?? ''
const ARK_MODEL = process.env.ARK_MODEL ?? ''

export async function GET() {
  const info = {
    hasApiKey: !!ARK_API_KEY,
    apiKeyPrefix: ARK_API_KEY ? ARK_API_KEY.slice(0, 8) + '...' : '(empty)',
    model: ARK_MODEL || '(empty)',
    apiResult: null as string | null,
    apiStatus: null as number | null,
    apiError: null as string | null,
    durationMs: 0,
  }

  if (!ARK_API_KEY || !ARK_MODEL) {
    return Response.json({ ...info, apiError: 'ARK_API_KEY 或 ARK_MODEL 未配置' }, { status: 200 })
  }

  const body = JSON.stringify({
    model: ARK_MODEL,
    max_tokens: 20,
    stream: false,
    messages: [{ role: 'user', content: 'Reply with just: OK' }],
  })

  const t0 = Date.now()

  return new Promise<Response>((resolve) => {
    let rawBody = ''
    const req = https.request({
      hostname: 'ark.cn-beijing.volces.com',
      path: '/api/v3/chat/completions',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${ARK_API_KEY}`,
        'Content-Length': Buffer.byteLength(body),
      },
      timeout: 15000,
    }, (res) => {
      info.apiStatus = res.statusCode ?? null
      res.on('data', (c: Buffer) => { rawBody += c.toString() })
      res.on('end', () => {
        info.durationMs = Date.now() - t0
        try {
          const json = JSON.parse(rawBody)
          if (json.error) {
            info.apiError = `${json.error.code ?? ''}: ${json.error.message ?? JSON.stringify(json.error)}`
          } else {
            info.apiResult = json.choices?.[0]?.message?.content ?? rawBody.slice(0, 200)
          }
        } catch {
          info.apiError = `JSON parse failed: ${rawBody.slice(0, 300)}`
        }
        resolve(Response.json(info))
      })
      res.on('error', (e: Error) => {
        info.apiError = 'Response error: ' + e.message
        info.durationMs = Date.now() - t0
        resolve(Response.json(info))
      })
    })
    req.on('error', (e: Error) => {
      info.apiError = 'Request error: ' + e.message
      info.durationMs = Date.now() - t0
      resolve(Response.json(info))
    })
    req.on('timeout', () => {
      req.destroy()
      info.apiError = '请求超时 (15s)'
      info.durationMs = Date.now() - t0
      resolve(Response.json(info))
    })
    req.write(body)
    req.end()
  })
}
