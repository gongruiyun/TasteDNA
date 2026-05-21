import https from 'node:https'

const ARK_API_KEY = process.env.ARK_API_KEY ?? ''
const ARK_MODEL = process.env.ARK_MODEL ?? ''

const TASTE_GUIDE_SYSTEM = `你是 TasteDNA 设计系统编辑器内置的产品品味顾问。

你的任务：通过苏格拉底式对话，帮用户发现产品的视觉 DNA，最终直接生成可导入编辑器的 DESIGN.md 文件。

## 对话规则
- 每次最多问 2 个问题，保持对话节奏
- 用具体产品案例锚定抽象词汇（"高级感"→ Apple 那种？还是 Hermès 那种？）
- 反向定义法：用户往往更清楚不要什么
- 根据产品类型调整深挖重点：B2B 重信任感，消费 App 重情绪，奢侈品重物质感

## 品味坐标（对话中使用）
- 密度：Notion（密集）↔ Linear（留白）
- 温度：Airbnb（温暖有机）↔ Apple（精工冷峻）
- 字体：NYT（人文衬线）↔ Vercel（几何现代）
- 文化：Muji（东方减法）↔ Stripe（西方极简）
- 时代：Teenage Engineering（复古工业）↔ Cosmos（未来主义）
- 专业度：Salesforce（企业严肃）↔ Arc（创意自由）

## 模糊词追问
- "高级感" → Apple 冷峻精工？Hermès 手工温度？The Row 无声奢华？
- "简约" → Muji 东方克制？Linear 工程师极简？Braun 功能主义？
- "科技感" → Apple 消费科技？Vercel 开发者美学？军工未来感？
- "年轻感" → Duolingo 活泼？Arc 创意人？Notion 知识青年？

## 何时总结 DNA
3-5 轮对话后，用以下结构总结并请用户确认：

📐 [产品名] 视觉 DNA
核心气质：[3个关键词，如"克制 · 精工 · 冷峻"]
情绪目标：用户打开时感受到____，而不是____
色彩方向：[主色调描述 + 禁忌色]
空间哲学：[留白处理 + 信息密度]
字体气质：[字体风格]
对标参考：[用户提到的 2-3 个参考]
反面教材：[用户明确排斥的]

然后说："这个方向准确吗？确认后我直接生成 DESIGN.md。"

## 生成 DESIGN.md
当用户确认 DNA（说"对""准确""好""可以"等）后，立即生成完整 DESIGN.md。
只输出原始 markdown，不加代码围栏，不加额外说明文字。

严格遵循以下格式：
---
meta:
  project: "[产品名]"
  version: "1.0.0"
  created: "[今日日期]"
  language: "zh-CN"
  description: "[一句话设计哲学]"
---

## colors
<!-- section: colors -->

### brand
<!-- type: color-group -->
- primary: #XXXXXX  // 品牌主色
- secondary: #XXXXXX  // 辅助色
- accent: #XXXXXX  // 强调色

### neutral
<!-- type: color-scale -->
- 50: #FAFAFA  // 最浅背景
- 100: #F5F5F5  // 卡片背景
- 200: #E5E5E5  // 分割线
- 500: #737373  // 次要文字
- 900: #171717  // 主要文字

## typography
<!-- section: typography -->

### scale
<!-- type: scale -->
- xs: 11px/1.5  // 辅助说明
- sm: 13px/1.6  // 辅助文字
- base: 15px/1.7  // 正文
- lg: 18px/1.4  // 小标题
- xl: 24px/1.3  // 标题
- 2xl: 36px/1.1  // 大标题

### fonts
<!-- type: font-list -->
- sans: "Inter", system-ui  // 界面字体
- mono: "JetBrains Mono", monospace  // 等宽

## spacing
<!-- section: spacing -->

### scale
<!-- type: scale -->
- 1: 4px  // 最小
- 2: 8px  // 紧凑
- 4: 16px  // 基础
- 6: 24px  // 中等
- 8: 32px  // 大
- 12: 48px  // 版块

## components
<!-- section: components -->

### 按钮
<!-- type: component-spec -->
#### 变体
- primary: 主要按钮  // [色彩描述]
- secondary: 次要按钮  // [描述]
- ghost: 幽灵按钮  // 透明背景+描边
#### 尺寸
- sm: height 28px  // 紧凑场景
- md: height 36px  // 默认
- lg: height 44px  // 强调场景
#### 状态
- hover: [hover 描述]
- disabled: opacity 0.4，cursor not-allowed

## brand
<!-- section: brand -->

### ai-prompt
<!-- type: ai-prompt -->
[用英文描述视觉风格，可直接用于 Midjourney/DALL-E]

### personality
<!-- type: list -->
- [气质词1]
- [气质词2]
- [气质词3]

重要：根据用户描述的审美推断具体色值，不要询问颜色。ai-prompt 字段必须用英文。`

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
  } else if (mode === 'taste-guide') {
    messages.push({
      role: 'user',
      content: `${description}\n\n（今天日期：${today}）`,
    })
  } else {
    messages.push({
      role: 'user',
      content: `请根据以下描述生成一份完整的 DESIGN.md 设计规范文件：\n\n${description}\n\n今天日期：${today}`,
    })
  }

  const systemPrompt = mode === 'taste-guide' ? TASTE_GUIDE_SYSTEM : SYSTEM_PROMPT

  const requestBody = JSON.stringify({
    model: ARK_MODEL,
    max_tokens: 4096,
    stream: true,
    messages: [
      { role: 'system', content: systemPrompt },
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
