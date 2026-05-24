import https from 'node:https'

const ARK_API_KEY = process.env.ARK_API_KEY ?? ''
const ARK_MODEL = process.env.ARK_MODEL ?? ''

type Style = 'outline' | 'filled' | 'duotone'
type Corner = 'sharp' | 'subtle' | 'round'

interface IconSpec {
  style: Style
  gridSize: number
  strokeWeight: number
  cap: 'round' | 'square'
  corner: Corner
}

function getStyleDesc(style: Style): string {
  if (style === 'outline') return 'outline — stroke only, fill="none" on all shapes'
  if (style === 'filled') return 'filled — solid fill="currentColor", no strokes'
  return 'duotone — main shape at opacity 0.15 + key details at opacity 1, both using currentColor'
}

function getCornerRadius(corner: Corner, gridSize: number): number {
  if (corner === 'sharp') return 0
  if (corner === 'subtle') return Math.round(gridSize * 0.08)
  return Math.round(gridSize * 0.17)
}

export async function POST(request: Request) {
  const body = await request.json()
  const { spec, names }: { spec: IconSpec; names: string[] } = body

  const { style, gridSize, strokeWeight, cap, corner } = spec
  const styleDesc = getStyleDesc(style)
  const cornerRadius = getCornerRadius(corner, gridSize)
  const padding = Math.round(gridSize * 0.083) // ~2px at 24, 1.3px at 16

  const prompt = `You are an expert SVG icon designer. Generate ${names.length} clean SVG icons.

STYLE SPECIFICATION:
- viewBox: "0 0 ${gridSize} ${gridSize}"
- Visual style: ${styleDesc}  (outline=stroke only fill="none" | filled=solid fill="currentColor" | duotone=main shape opacity 0.15 + key details opacity 1)
- stroke-width="${strokeWeight}" stroke-linecap="${cap}" stroke-linejoin="${cap === 'round' ? 'round' : 'miter'}"
- Rectangles: rx="${cornerRadius}"
- Colors: ONLY use currentColor, no hardcoded hex values
- Padding: minimum ${padding}px from all edges
- No width/height attributes on <svg> element

ICONS TO GENERATE: ${names.join(', ')}

OUTPUT — for each icon output EXACTLY this format with no deviations:
===ICON:iconname===
<svg viewBox="0 0 ${gridSize} ${gridSize}" fill="none" xmlns="http://www.w3.org/2000/svg">
  [paths]
</svg>
===END===

Generate all ${names.length} icons sequentially. Be precise and consistent with the style spec.`

  const requestBody = JSON.stringify({
    model: ARK_MODEL,
    max_tokens: 8192,
    stream: true,
    messages: [
      { role: 'user', content: prompt },
    ],
  })

  const encoder = new TextEncoder()
  const { readable, writable } = new TransformStream<Uint8Array, Uint8Array>()
  const writer = writable.getWriter()

  const pump = () => new Promise<void>((resolve, reject) => {
    const req = https.request({
      hostname: 'ark.cn-beijing.volces.com',
      path: '/api/v3/chat/completions',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${ARK_API_KEY}`,
        'Content-Length': Buffer.byteLength(requestBody),
      },
      timeout: 120000,
    }, (res) => {
      if (res.statusCode && res.statusCode >= 400) {
        let errBody = ''
        res.on('data', (c: Buffer) => { errBody += c.toString() })
        res.on('end', () => {
          const isAuth = res.statusCode === 401 || res.statusCode === 403
          writer.write(encoder.encode(isAuth ? '__ERROR_401__' : `__ERROR__: ${res.statusCode} ${errBody.slice(0, 200)}`))
            .then(() => writer.close()).then(resolve).catch(reject)
        })
        return
      }
      const decoder = new TextDecoder()
      let writeQueue = Promise.resolve()
      res.on('data', (chunk: Buffer) => {
        const lines = decoder.decode(chunk, { stream: true }).split('\n')
        for (const line of lines) {
          if (!line.startsWith('data:')) continue
          const data = line.slice(5).trim()
          if (data === '[DONE]') continue
          try {
            const json = JSON.parse(data)
            const text: string | undefined = json.choices?.[0]?.delta?.content
            if (text) {
              const encoded = encoder.encode(text)
              writeQueue = writeQueue.then(() => writer.write(encoded))
            }
          } catch {
            // skip malformed SSE lines
          }
        }
      })
      res.on('end', () => { writeQueue.then(() => writer.close()).then(resolve).catch(reject) })
      res.on('error', reject)
    })
    req.on('error', reject)
    req.on('timeout', () => req.destroy(new Error('request timeout')))
    req.write(requestBody)
    req.end()
  })

  pump().catch(() => writer.close().catch(() => {}))

  return new Response(readable, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'X-Content-Type-Options': 'nosniff',
      'Cache-Control': 'no-cache',
    },
  })
}
