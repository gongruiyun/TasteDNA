import https from 'node:https'

const ARK_API_KEY = process.env.ARK_API_KEY ?? ''
const ARK_MODEL = process.env.ARK_MODEL ?? ''

const FORMAT_RULES = `
STRICT DESIGN.MD FORMAT — follow exactly:

1. YAML frontmatter:
---
meta:
  project: "Name"
  version: "1.0.0"
  created: "YYYY-MM-DD"
  language: "zh-CN"
  description: "..."
---

2. H2 section + comment:
## colors
<!-- section: colors -->

3. H3 subsection + type + tokens:
### brand
<!-- type: color-group -->
- primary: #4F6EF7  // 品牌主色

4. Token: \`- name: value  // 中文说明\`

5. Type values:
- color-group   → color swatches
- color-scale   → neutral/gray strip
- gradient-group→ linear-gradient(...)
- scale         → numeric (px / ratio / weight)
- shadow-scale  → box-shadow values
- easing-group  → cubic-bezier(...)
- font-list     → font stacks
- text          → paragraph
- ai-prompt     → English visual description
- list          → keywords
- component-spec→ component with #### sub-groups (variants/sizes/states)

6. component-spec format example:
### 按钮
<!-- type: component-spec -->
#### 变体
- primary: 主要按钮 // 蓝色填充，用于核心操作
- secondary: 次要按钮 // 白色背景+描边
- danger: 危险按钮 // 红色填充，破坏性操作
#### 尺寸
- sm: height 28px // 紧凑场景
- md: height 36px // 默认
- lg: height 44px // 强调场景
#### 状态
- hover: 背景加深 10%
- disabled: opacity 0.4，cursor not-allowed

7. Required sections: colors (brand + neutral), typography, spacing
8. Use component-spec (not text) for all ### subsections inside ## components.
9. Output ONLY raw DESIGN.md. No code fences, no extra text.
10. Chinese // comments for all tokens.`

const SYSTEM_PROMPT = `You are a professional design system expert.${FORMAT_RULES}`

export async function POST(request: Request) {
  const body = await request.json()
  const { mode, description, images, imageBase64, mimeType, urlData, currentContent, history } = body
  const imageList: Array<{ base64: string; mime: string }> =
    images ?? (imageBase64 ? [{ base64: imageBase64, mime: mimeType ?? 'image/png' }] : [])
  const today = new Date().toISOString().slice(0, 10)

  type OAIMessage = { role: string; content: string | OAIContent[] }
  type OAIContent = { type: string; text?: string; image_url?: { url: string } }

  const messages: OAIMessage[] = []

  if (history?.length) {
    for (const msg of history) {
      messages.push({ role: msg.role, content: msg.content })
    }
  }

  if (mode === 'translate' && currentContent) {
    const targetLang = description === 'en' ? 'English' : 'Chinese (Simplified)'
    const targetHint = description === 'en'
      ? 'Translate ALL Chinese text (// comments, meta description, token names explanations) to English. Keep all structural syntax, hex values, and px/rem numbers unchanged. Output ONLY the translated DESIGN.md.'
      : '将所有英文文本（// 注释、meta description、说明文字）翻译成简体中文。保持所有结构语法、hex 色值和 px/rem 数字不变。只输出翻译后的 DESIGN.md。'
    messages.push({
      role: 'user',
      content: `Translate the following DESIGN.md content to ${targetLang}.\n\n${targetHint}\n\n\`\`\`\n${currentContent}\n\`\`\``,
    })
  } else if (mode === 'refine' && currentContent) {
    messages.push({
      role: 'user',
      content: `当前 DESIGN.md 内容如下：\n\n\`\`\`\n${currentContent}\n\`\`\`\n\n请根据以下要求修改并返回完整的新版本：\n${description}`,
    })
  } else if (mode === 'image' && imageList.length > 0) {
    const content: OAIContent[] = [
      ...imageList.map(img => ({
        type: 'image_url',
        image_url: { url: `data:${img.mime};base64,${img.base64}` },
      })),
      {
        type: 'text',
        text: `请分析这${imageList.length > 1 ? `${imageList.length}张` : ''}图片的视觉设计风格（颜色、字体、间距、整体调性），生成一份完整的 DESIGN.md 设计规范文件。今天日期：${today}${description ? `\n\n补充说明：${description}` : ''}`,
      },
    ]
    messages.push({ role: 'user', content })
  } else if (mode === 'url' && urlData) {
    const { title, colors, fonts, cssVars, description: pageDesc } = urlData
    const varList = Object.entries(cssVars ?? {}).slice(0, 30).map(([k, v]) => `--${k}: ${v}`).join('\n')
    messages.push({
      role: 'user',
      content: `请根据以下从网页 "${title}" 提取的设计信息，生成一份完整的 DESIGN.md 设计规范文件。今天日期：${today}

页面描述：${pageDesc || '无'}
提取到的颜色：${colors?.join(', ') || '无'}
提取到的字体：${fonts?.join(', ') || '无'}
CSS 变量：\n${varList || '无'}

${description ? `补充说明：${description}` : ''}`,
    })
  } else {
    messages.push({
      role: 'user',
      content: `请根据以下描述生成一份完整的 DESIGN.md 设计规范文件：\n\n${description}\n\n今天日期：${today}`,
    })
  }

  const requestBody = JSON.stringify({
    model: ARK_MODEL,
    max_tokens: 4096,
    stream: true,
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      ...messages,
    ],
  })

  // Use node:https to bypass Next.js fetch instrumentation / connect timeout
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
      timeout: 60000,
    }, (res) => {
      if (res.statusCode && res.statusCode >= 400) {
        let body = ''
        res.on('data', (c: Buffer) => { body += c.toString() })
        res.on('end', () => {
          const isAuth = res.statusCode === 401 || res.statusCode === 403
          writer.write(encoder.encode(isAuth ? '__ERROR_401__' : `__ERROR__: ${res.statusCode} ${body.slice(0, 200)}`))
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
