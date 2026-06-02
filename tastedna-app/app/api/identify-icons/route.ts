import https from 'node:https'

const ARK_API_KEY = process.env.ARK_API_KEY ?? ''
const ARK_MODEL = process.env.ARK_MODEL ?? ''

export async function POST(request: Request) {
  const { images }: { images: { base64: string; mime: string }[] } = await request.json()
  if (!images?.length) return Response.json({ error: 'No images' }, { status: 400 })

  const prompt = `You are an icon identifier. I will show you ${images.length} icon image(s).

For each icon, identify what it represents and return the standard icon name in lowercase kebab-case (e.g. "search", "home", "settings", "user", "star", "heart", "bell", "trash", "edit", "download", "share", "menu", "arrow-right", "chevron-down", "check", "close", "plus", "minus", "lock", "unlock", "eye", "eye-off", "send", "file", "folder", "image", "link", "mail", "map-pin", "phone", "calendar", "clock", "filter", "sort", "grid", "list", "refresh", "upload", "cloud", "database", "code", "terminal", "layers", "zap", "wifi", "bluetooth", "cpu", etc.)

Return ONLY a JSON array of strings — one name per image, in order:
["name1", "name2", ...]

No explanation. Just the JSON array.`

  type ContentPart =
    | { type: 'text'; text: string }
    | { type: 'image_url'; image_url: { url: string } }

  const content: ContentPart[] = images.map(img => ({
    type: 'image_url' as const,
    image_url: { url: `data:${img.mime};base64,${img.base64}` },
  }))
  content.push({ type: 'text', text: prompt })

  const requestBody = JSON.stringify({
    model: ARK_MODEL,
    max_tokens: 512,
    stream: false,
    messages: [{ role: 'user', content }],
  })

  return new Promise<Response>((resolve) => {
    let body = ''
    const req = https.request({
      hostname: 'ark.cn-beijing.volces.com',
      path: '/api/v3/chat/completions',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${ARK_API_KEY}`,
        'Content-Length': Buffer.byteLength(requestBody),
      },
      timeout: 30000,
    }, (res) => {
      res.on('data', (chunk: Buffer) => { body += chunk.toString() })
      res.on('end', () => {
        try {
          const json = JSON.parse(body)
          const text: string = json.choices?.[0]?.message?.content ?? ''
          // Extract JSON array from response
          const match = text.match(/\[[\s\S]*?\]/)
          if (match) {
            const names: string[] = JSON.parse(match[0])
            resolve(Response.json({ names }))
          } else {
            resolve(Response.json({ error: 'Could not parse names', raw: text }, { status: 500 }))
          }
        } catch {
          resolve(Response.json({ error: 'Parse error', raw: body.slice(0, 200) }, { status: 500 }))
        }
      })
      res.on('error', () => resolve(Response.json({ error: 'Request failed' }, { status: 500 })))
    })
    req.on('error', () => resolve(Response.json({ error: 'Request error' }, { status: 500 })))
    req.on('timeout', () => { req.destroy(); resolve(Response.json({ error: 'Timeout' }, { status: 500 })) })
    req.write(requestBody)
    req.end()
  })
}
