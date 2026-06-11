import https from 'node:https'

const ARK_API_KEY = process.env.ARK_API_KEY ?? ''
const ARK_MODEL = process.env.ARK_MODEL ?? ''

type Style = 'outline' | 'filled' | 'duotone'
type Corner = 'sharp' | 'subtle' | 'round'
type ColorMode = 'single' | 'multi'

interface IconSpec {
  style: Style
  gridSize: number
  strokeWeight: number
  cap: 'round' | 'square'
  corner: Corner
  colorMode: ColorMode
  opticalPad?: number   // px per side, default 1
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
  const { spec, names, paletteColors, refImages, conceptImages, conceptHint, lucideBases, descriptions }: {
    spec: IconSpec
    names: string[]
    paletteColors?: string[]
    refImages?: { base64: string; mime: string }[]
    conceptImages?: { base64: string; mime: string }[]
    conceptHint?: string
    lucideBases?: Record<string, string>
    descriptions?: Record<string, string>
  } = body

  const { style, gridSize, strokeWeight, cap, corner, colorMode, opticalPad = 1 } = spec
  const styleDesc = getStyleDesc(style)
  const cornerRadius = getCornerRadius(corner, gridSize)
  const padding = opticalPad

  // Style-specific instructions in Chinese for better model comprehension
  let styleInstructions: string
  if (style === 'outline') {
    styleInstructions = `样式：线性描边（outline）
• <svg> 标签本身保持 fill="none"
• 所有 path / line / circle / rect / polyline 等形状：fill="none"，stroke="currentColor"
• 统一使用 stroke-width="${strokeWeight}" stroke-linecap="${cap}" stroke-linejoin="${cap === 'round' ? 'round' : 'miter'}"
• 不使用任何填充色，所有视觉效果通过描边实现`
  } else if (style === 'filled') {
    styleInstructions = `样式：实心填充（filled）
• 所有形状 fill="currentColor"，不加 stroke 属性
• 不使用描边，通过形状的负空间表达细节（例如用镂空表示孔洞）
• 形状边缘清晰，整体是实心剪影风格`
  } else {
    styleInstructions = `样式：双色调（duotone）
• 主体背景形状：fill="currentColor" opacity="0.15"，无 stroke
• 关键前景细节：fill="currentColor" opacity="1"，无 stroke
• 通过透明度差异营造层次感，两层形状叠加`
  }

  const colorInstructions = colorMode === 'multi'
    ? paletteColors && paletteColors.length > 0
      ? `色彩：多色模式 — 严格使用以下调色板：${paletteColors.join('、')}，根据语义分配给图标各部分，不引入其他颜色`
      : `色彩：多色模式 — 为每个图标自选 2~4 个协调的十六进制颜色，使图标富有层次感`
    : `色彩：单色模式 — 所有 fill 和 stroke 只能使用 currentColor，禁止任何硬编码颜色值`

  // Hardcoded clean examples per grid size — avoid programmatic coordinate weirdness
  // r() rounds to nearest 0.5 for crisp pixel-aligned coordinates
  const r = (n: number) => Math.round(n * 2) / 2
  const g = gridSize
  const sw = strokeWeight
  const lc = cap

  const exampleSearch = style === 'outline'
    ? `===ICON:search===
<svg viewBox="0 0 ${g} ${g}" fill="none" xmlns="http://www.w3.org/2000/svg">
  <circle cx="${r(g*0.458)}" cy="${r(g*0.458)}" r="${r(g*0.292)}" stroke="currentColor" stroke-width="${sw}"/>
  <path d="M${r(g*0.688)} ${r(g*0.688)}L${r(g*0.875)} ${r(g*0.875)}" stroke="currentColor" stroke-width="${sw}" stroke-linecap="${lc}"/>
</svg>
===END===`
    : style === 'filled'
    ? `===ICON:search===
<svg viewBox="0 0 ${g} ${g}" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path fill-rule="evenodd" clip-rule="evenodd" d="M${r(g*0.458)} ${r(g*0.125)}a${r(g*0.333)} ${r(g*0.333)} 0 1 0 0 ${r(g*0.667)}a${r(g*0.333)} ${r(g*0.333)} 0 0 0 0-${r(g*0.667)}zm-${r(g*0.417)} ${r(g*0.333)}a${r(g*0.417)} ${r(g*0.417)} 0 1 1 ${r(g*0.833)} 0a${r(g*0.417)} ${r(g*0.417)} 0 0 1-${r(g*0.833)} 0z" fill="currentColor"/>
  <path d="M${r(g*0.688)} ${r(g*0.688)}L${r(g*0.875)} ${r(g*0.875)}" stroke="currentColor" stroke-width="${r(sw*1.5)}" stroke-linecap="round"/>
</svg>
===END===`
    : `===ICON:search===
<svg viewBox="0 0 ${g} ${g}" fill="none" xmlns="http://www.w3.org/2000/svg">
  <circle cx="${r(g*0.458)}" cy="${r(g*0.458)}" r="${r(g*0.292)}" fill="currentColor" opacity="0.15"/>
  <circle cx="${r(g*0.458)}" cy="${r(g*0.458)}" r="${r(g*0.167)}" fill="currentColor"/>
  <path d="M${r(g*0.688)} ${r(g*0.688)}L${r(g*0.875)} ${r(g*0.875)}" stroke="currentColor" stroke-width="${r(sw*1.5)}" stroke-linecap="round"/>
</svg>
===END===`

  const exampleEdit = style === 'outline'
    ? `===ICON:edit===
<svg viewBox="0 0 ${g} ${g}" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M${r(g*0.167)} ${r(g*0.833)}L${r(g*0.333)} ${r(g*0.833)}L${r(g*0.771)} ${r(g*0.396)}L${r(g*0.604)} ${r(g*0.229)}L${r(g*0.167)} ${r(g*0.667)}V${r(g*0.833)}Z" stroke="currentColor" stroke-width="${sw}" stroke-linejoin="${lc === 'round' ? 'round' : 'miter'}"/>
  <path d="M${r(g*0.708)} ${r(g*0.146)}l${r(g*0.146)} ${r(g*0.146)}a${r(g*0.104)} ${r(g*0.104)} 0 0 1 0 ${r(g*0.146)}l-${r(g*0.104)} ${r(g*0.104)}-${r(g*0.292)}-${r(g*0.292)} ${r(g*0.104)}-${r(g*0.104)}a${r(g*0.104)} ${r(g*0.104)} 0 0 1 ${r(g*0.146)} 0z" stroke="currentColor" stroke-width="${sw}" stroke-linejoin="${lc === 'round' ? 'round' : 'miter'}"/>
</svg>
===END===`
    : `===ICON:edit===
<svg viewBox="0 0 ${g} ${g}" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M${r(g*0.167)} ${r(g*0.833)}L${r(g*0.333)} ${r(g*0.833)}L${r(g*0.771)} ${r(g*0.396)}L${r(g*0.604)} ${r(g*0.229)}L${r(g*0.167)} ${r(g*0.667)}V${r(g*0.833)}Z" fill="currentColor"/>
  <path d="M${r(g*0.708)} ${r(g*0.146)}l${r(g*0.146)} ${r(g*0.146)}a${r(g*0.104)} ${r(g*0.104)} 0 0 1 0 ${r(g*0.146)}l-${r(g*0.104)} ${r(g*0.104)}-${r(g*0.292)}-${r(g*0.292)} ${r(g*0.104)}-${r(g*0.104)}a${r(g*0.104)} ${r(g*0.104)} 0 0 1 ${r(g*0.146)} 0z" fill="currentColor"/>
</svg>
===END===`

  const lucideSection = lucideBases && Object.keys(lucideBases).length > 0
    ? `\n\n━━━ 基础图标参考（Lucide 开源库）━━━
以下图标有来自 Lucide 的高质量基础 SVG，请优先基于它修改样式，而不是从零设计：
- 保留原始路径坐标和形状结构
- 只修改 stroke-width、fill、stroke-linecap、stroke-linejoin、rx 等样式属性
- 可以轻微简化路径但不改变视觉概念
- 没有提供基础图标的，从零设计

${Object.entries(lucideBases).map(([name, svg]) => `===LUCIDE:${name}===\n${svg}\n===LUCIDE-END===`).join('\n\n')}`
    : ''

  const prompt = `你是专业的 UI 图标设计师，输出质量对标 Lucide Icons 和 Heroicons。

请依次生成以下 ${names.length} 个图标的 SVG 源码：
${names.map((n, i) => {
    const desc = descriptions?.[n]
    return desc ? `${i + 1}. Generate icon for '${n}': ${desc}` : `${i + 1}. ${n}`
  }).join('\n')}

━━━ 画布规格 ━━━
• viewBox="0 0 ${g} ${g}"，<svg> 标签不加 width/height 属性
• 有效绘制区域：${padding} ~ ${g - padding}（四边各留 ${padding}px 安全边距）
• 图标视觉大小应占有效区域的 65~75%，不要太小
• 图形在画布内光学居中

━━━ 视觉风格 ━━━
${styleInstructions}

━━━ 精度与质量规范 ━━━
• 坐标值优先取 0.5 的倍数（如 3、3.5、4、7.5…），有利于像素对齐，渲染更清晰
• 同一图标内所有 stroke 元素必须使用相同的 stroke-width="${sw}" 和 stroke-linecap="${lc}"
• 对角线元素优先使用 45° 角，矩形/菱形优先保持水平垂直对称
• 每个图标 2~5 个路径/形状，结构简洁、轮廓清晰

━━━ 绝对禁止 ━━━
• 禁止：<defs>、<use>、<symbol>、<pattern>、<mask>、<clipPath>、<filter>
• 禁止：<linearGradient>、<radialGradient>
• 禁止：transform 属性（包括 translate / rotate / scale / matrix）
• 禁止：style 内联属性
• 禁止：stroke-dasharray、stroke-dashoffset
• ${colorInstructions}

━━━ 参考示例（按此精度输出）━━━
${exampleSearch}

${exampleEdit}

━━━ 输出格式（严格遵守，不加任何注释或解释）━━━
===ICON:图标名===
<svg viewBox="0 0 ${g} ${g}" fill="none" xmlns="http://www.w3.org/2000/svg">
  [路径内容]
</svg>
===END===${lucideSection}`

  // Build message content — multimodal if ref images provided
  type ContentPart =
    | { type: 'text'; text: string }
    | { type: 'image_url'; image_url: { url: string } }

  const userContent: ContentPart[] = []
  const hasRefImages = refImages && refImages.length > 0
  const hasConceptImages = conceptImages && conceptImages.length > 0

  if (hasRefImages || hasConceptImages) {
    // Style reference images first
    if (hasRefImages) {
      userContent.push({ type: 'text', text: '[STYLE REFERENCE IMAGES — These show the visual style to follow: stroke weight, corner style, fill type, color palette, etc.]' })
      refImages!.forEach(img => {
        userContent.push({ type: 'image_url', image_url: { url: `data:${img.mime};base64,${img.base64}` } })
      })
    }

    // Concept reference images — identify the subject, do NOT copy the visual
    if (hasConceptImages) {
      const hintLine = conceptHint ? `\nUser description hint: "${conceptHint}" — use this to guide the abstraction.` : ''
      userContent.push({ type: 'text', text: `[CONCEPT REFERENCE IMAGES — ${conceptImages!.length} image(s) follow, one per icon in order.
CRITICAL RULES for concept images:
1. DO NOT copy, trace, or replicate the composition, structure, or visual style of these images.
2. DO NOT reproduce logos, borders, frames, or decorative elements from the reference.
3. ONLY use them to identify the subject or concept (e.g. "a database", "a dolphin", "a shopping cart").
4. Then design a FRESH, MINIMAL icon from scratch that abstractly represents that same concept using simple geometric shapes within the SVG grid system.
The result should be a clean functional icon — not a reproduction of the reference image.${hintLine}]` })
      conceptImages!.forEach(img => {
        userContent.push({ type: 'image_url', image_url: { url: `data:${img.mime};base64,${img.base64}` } })
      })
    }

    const notes: string[] = []
    if (hasRefImages) notes.push('match the visual style shown in the style reference images')
    if (hasConceptImages) notes.push('use concept reference images ONLY to identify what subject each icon represents — design each icon fresh as a clean geometric abstraction, never copying the reference appearance')
    const hintSuffix = !hasConceptImages && conceptHint ? `\n\nDesign hint from user: "${conceptHint}"` : ''
    userContent.push({ type: 'text', text: prompt + (notes.length ? `\n\nIMPORTANT: ${notes.join(', and ')}.` : '') + hintSuffix })
  } else {
    const hintSuffix = conceptHint ? `\n\nDesign hint from user: "${conceptHint}"` : ''
    userContent.push({ type: 'text', text: prompt + hintSuffix })
  }

  // Scale max_tokens: thinking models use extra tokens for reasoning before output
  // Budget ~1500 tokens per icon (reasoning overhead + SVG content)
  const maxTokens = Math.min(16384, Math.max(2048, names.length * 1500))

  const requestBody = JSON.stringify({
    model: ARK_MODEL,
    max_tokens: maxTokens,
    stream: true,
    messages: [
      { role: 'user', content: (hasRefImages || hasConceptImages) ? userContent : prompt },
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
      timeout: 300000, // 5 min — thinking models need extra time before first token
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
            const delta = json.choices?.[0]?.delta
            const text: string | undefined = delta?.content
            const reasoning: string | undefined = delta?.reasoning_content
            if (text) {
              const encoded = encoder.encode(text)
              writeQueue = writeQueue.then(() => writer.write(encoded))
            } else if (reasoning) {
              // Thinking model is still reasoning — send a heartbeat so client knows it's alive
              writeQueue = writeQueue.then(() => writer.write(encoder.encode('\x00')))
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
