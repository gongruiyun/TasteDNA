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
必须输出所有 section，组件部分必须包含以下所有组件，不得省略。

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
- surface: #XXXXXX  // 表面/背景色

### neutral
<!-- type: color-scale -->
- 50: #FAFAFA  // 最浅背景
- 100: #F5F5F5  // 卡片背景
- 200: #E5E5E5  // 分割线
- 300: #D4D4D4  // 禁用描边
- 400: #A3A3A3  // placeholder
- 500: #737373  // 次要文字
- 700: #404040  // 辅助文字
- 900: #171717  // 主要文字

### semantic
<!-- type: color-group -->
- success: #XXXXXX  // 成功/正向
- warning: #XXXXXX  // 警告
- error: #XXXXXX  // 错误/危险
- info: #XXXXXX  // 信息提示

## typography
<!-- section: typography -->

### scale
<!-- type: scale -->
- xs: 11px/1.5  // 标注、辅助说明
- sm: 13px/1.6  // 辅助文字、标签
- base: 15px/1.7  // 正文
- lg: 18px/1.4  // 小标题
- xl: 24px/1.3  // 标题
- 2xl: 32px/1.2  // 大标题
- 3xl: 48px/1.1  // 展示标题

### fonts
<!-- type: font-list -->
- sans: "Inter", system-ui  // 界面主字体
- serif: "Georgia", serif  // 正文/内容字体（如适用）
- mono: "JetBrains Mono", monospace  // 代码/数值

### weight
<!-- type: scale -->
- regular: 400  // 正文
- medium: 500  // 强调
- semibold: 600  // 标题
- bold: 700  // 重点标题

## spacing
<!-- section: spacing -->

### scale
<!-- type: scale -->
- 0.5: 2px  // 微间距
- 1: 4px  // 最小
- 2: 8px  // 紧凑
- 3: 12px  // 小
- 4: 16px  // 基础
- 6: 24px  // 中等
- 8: 32px  // 大
- 10: 40px  // 较大
- 12: 48px  // 版块
- 16: 64px  // 大版块
- 24: 96px  // 页面留白

## radius
<!-- section: radius -->

### scale
<!-- type: scale -->
- none: 0px  // 无圆角
- sm: 4px  // 小元素
- md: 8px  // 默认
- lg: 12px  // 卡片
- xl: 16px  // 大卡片
- 2xl: 24px  // 特殊元素
- full: 9999px  // 胶囊/圆形

## shadows
<!-- section: shadows -->

### scale
<!-- type: shadow-scale -->
- xs: 0 1px 2px rgba(0,0,0,0.05)  // 微阴影
- sm: 0 2px 8px rgba(0,0,0,0.08)  // 卡片
- md: 0 4px 16px rgba(0,0,0,0.12)  // 悬浮卡片
- lg: 0 8px 32px rgba(0,0,0,0.16)  // 模态框
- xl: 0 16px 48px rgba(0,0,0,0.20)  // 菜单/弹出层

## motion
<!-- section: motion -->

### easing
<!-- type: easing-group -->
- ease-in: cubic-bezier(0.4, 0, 1, 1)  // 退出动画
- ease-out: cubic-bezier(0, 0, 0.2, 1)  // 进入动画
- ease-in-out: cubic-bezier(0.4, 0, 0.2, 1)  // 状态切换
- spring: cubic-bezier(0.34, 1.56, 0.64, 1)  // 弹性交互

### duration
<!-- type: scale -->
- instant: 80ms  // 即时反馈
- fast: 150ms  // 微交互/hover
- normal: 250ms  // 默认过渡
- slow: 350ms  // 复杂动画
- page: 500ms  // 页面级过渡

## components
<!-- section: components -->

### 按钮
<!-- type: component-spec -->
#### 变体
- primary: 主要按钮  // [主色填充，核心操作]
- secondary: 次要按钮  // [弱填充或描边，辅助操作]
- ghost: 幽灵按钮  // 透明背景+描边
- danger: 危险按钮  // 红色，破坏性操作
- link: 链接按钮  // 无背景无描边，纯文字
#### 尺寸
- sm: height 28px, px 12px  // 紧凑/表格内
- md: height 36px, px 16px  // 默认
- lg: height 44px, px 20px  // 强调/表单提交
- xl: height 52px, px 24px  // 落地页 CTA
#### 状态
- hover: [背景/颜色变化描述]
- active: [按下反馈]
- disabled: opacity 0.4，cursor not-allowed
- loading: spinner 替换文字，禁用点击

### 输入框
<!-- type: component-spec -->
#### 变体
- default: 默认输入框  // [描边风格描述]
- filled: 填充型  // [背景色描述]
- underline: 下划线型  // 仅底部描边
#### 尺寸
- sm: height 28px  // 紧凑
- md: height 36px  // 默认
- lg: height 44px  // 突出场景
#### 状态
- focus: [focus ring/描边变化描述]
- error: 红色描边+错误提示文字
- success: 绿色描边+成功反馈
- disabled: opacity 0.4，背景变灰

### 选择器
<!-- type: component-spec -->
#### 变体
- select: 单选下拉  // [触发器样式]
- multi-select: 多选  // 已选项以标签展示
- combobox: 可搜索下拉  // 内置搜索输入
#### 状态
- open: 下拉展开，触发器高亮
- disabled: opacity 0.4

### 复选与开关
<!-- type: component-spec -->
#### 变体
- checkbox: 方形复选框  // [选中色描述]
- radio: 圆形单选框  // [选中色描述]
- switch: 滑动开关  // [开/关色描述]
#### 状态
- checked: [选中填充描述]
- indeterminate: 半选（仅 checkbox）
- disabled: opacity 0.4

### 卡片
<!-- type: component-spec -->
#### 变体
- default: 默认卡片  // [背景、阴影描述]
- elevated: 悬浮卡片  // 更深阴影，无描边
- outlined: 描边卡片  // 无阴影+描边
- interactive: 可点击卡片  // hover 有上浮+阴影增强
- flat: 扁平卡片  // 无阴影无描边，纯背景色区分
#### 区域
- header: 头部，标题+操作区
- body: 主体内容区，padding 16-24px
- footer: 底部，次要信息或操作

### 徽标与标签
<!-- type: component-spec -->
#### 变体
- default: 默认  // [中性色描述]
- primary: 品牌色标签
- success: 成功/绿
- warning: 警告/黄
- danger: 错误/红
- outline: 描边型，无背景
- dot: 圆点+文字  // 状态指示
#### 尺寸
- sm: height 18px, text 11px  // 角标
- md: height 22px, text 12px  // 默认
- lg: height 28px, text 13px  // 突出

### 头像
<!-- type: component-spec -->
#### 变体
- image: 图片头像  // 圆形/方形裁切
- initials: 文字首字母  // [背景色规则]
- icon: 图标占位  // [图标+背景描述]
- group: 头像组  // 叠加排列，最多显示N个
#### 尺寸
- xs: 20px  // 极紧凑
- sm: 28px  // 列表
- md: 36px  // 默认
- lg: 48px  // 个人页小图
- xl: 64px  // 个人页大图
- 2xl: 96px  // 详情页

### 提示与通知
<!-- type: component-spec -->
#### 变体
- toast: 浮动通知  // 右上角，3s 自动消失
- alert: 内嵌警告  // 页面内常驻
- banner: 顶部全宽通知  // 重要公告
- callout: 内容区提示块  // 文档/说明场景
#### 语义
- info: 信息，蓝色
- success: 成功，绿色
- warning: 警告，黄色
- error: 错误，红色
#### 元素
- icon: 左侧语义图标
- title: 标题（可选）
- description: 正文
- action: 操作链接（可选）
- close: 关闭按钮（可选）

### 模态框与弹层
<!-- type: component-spec -->
#### 变体
- dialog: 确认对话框  // 居中，遮罩背景
- sheet: 底部弹出  // 移动端，从下滑入
- drawer: 侧边抽屉  // 左或右，覆盖式
- popover: 气泡弹层  // 锚定触发元素
#### 尺寸（dialog）
- sm: max-width 400px  // 确认框
- md: max-width 560px  // 表单
- lg: max-width 720px  // 复杂内容
- full: 100vw 100vh  // 全屏
#### 状态
- overlay: 遮罩，[透明度/颜色描述]
- enter: [进入动画描述]
- exit: [退出动画描述]

### 导航
<!-- type: component-spec -->
#### 变体
- topbar: 顶部导航栏  // height 56-64px，[背景描述]
- sidebar: 侧边导航  // width 240-280px，[背景描述]
- bottom-nav: 移动端底部导航  // height 56px，5个以内
- breadcrumb: 面包屑  // 分隔符+层级
#### 元素
- logo: 品牌标识区，左侧
- nav-item: 导航项，[选中/hover 样式]
- actions: 右侧操作区（搜索/通知/头像）
- collapse: 侧边栏折叠，width 64px 图标模式

### 标签页
<!-- type: component-spec -->
#### 变体
- line: 下划线型  // 当前页底部高亮线
- pill: 胶囊型  // 当前页填充背景
- card: 卡片型  // 独立卡片感，带描边
- vertical: 垂直标签  // 左侧导航场景
#### 状态
- active: [选中样式，颜色/字重变化]
- hover: hover 反馈
- disabled: opacity 0.4

### 下拉菜单
<!-- type: component-spec -->
#### 变体
- dropdown: 常规下拉菜单  // [阴影/背景描述]
- context-menu: 右键菜单
- command: 命令面板  // 带搜索，全局快捷入口
#### 元素
- item: 菜单项，height 32px，px 12px
- item-icon: 左侧图标（可选）
- item-shortcut: 右侧快捷键提示
- divider: 分割线
- group-header: 分组标题，text-xs 大写

### 表格
<!-- type: component-spec -->
#### 变体
- default: 默认表格  // [行高、描边描述]
- bordered: 完整格线
- striped: 斑马纹，[奇偶行色差]
- compact: 紧凑，row-height 32px
#### 元素
- th: 表头，[背景色、字重、排序图标]
- td: 单元格，padding 12px 16px
- row-hover: [hover 背景色描述]
- row-selected: [选中背景色描述]
#### 功能
- sortable: 可排序列，点击切换方向
- selectable: 行复选框
- sticky-header: 滚动时表头吸顶

### 进度与加载
<!-- type: component-spec -->
#### 变体
- progress-bar: 横向进度条  // [高度、颜色、圆角描述]
- progress-ring: 环形进度  // SVG 圆环
- skeleton: 骨架屏  // [动画：shimmer 或 pulse]
- spinner: 旋转加载  // [尺寸、颜色描述]
- dots: 三点跳动  // 等待/输入中
#### 状态
- determinate: 有具体进度值
- indeterminate: 无限循环

### 工具提示
<!-- type: component-spec -->
#### 变体
- tooltip: 悬停提示  // 单行简短文字，[背景色描述]
- popover: 点击气泡  // 富内容，有标题和正文
#### 属性
- placement: top / bottom / left / right / auto
- arrow: 带指向箭头
- delay: hover 后 200-300ms 显示，避免误触
- max-width: tooltip 200px，popover 300px

### 分页
<!-- type: component-spec -->
#### 变体
- default: 页码列表  // [选中页样式]
- simple: 上一页/下一页  // 移动端常用
- mini: 极简"1/24"文字型
#### 元素
- prev/next: 前后翻页按钮
- page-item: 单页码，[选中填充或下划线]
- ellipsis: 省略号
- page-size: 每页条数选择器（可选）

### 搜索框
<!-- type: component-spec -->
#### 变体
- inline: 内嵌搜索框  // 普通输入框加搜索图标
- overlay: 全局搜索  // 覆盖式，居中，Command+K 唤起
- instant: 实时搜索  // 输入即触发，带结果下拉
#### 元素
- prefix-icon: 放大镜图标
- clear: 一键清空按钮
- shortcut: 快捷键提示（如⌘K）
- results-dropdown: 搜索结果下拉列表

### 表单布局
<!-- type: component-spec -->
#### 变体
- vertical: 垂直表单  // label 在上，input 在下
- horizontal: 水平表单  // label 在左，固定宽度
- inline: 内联表单  // 同行排列，紧凑
#### 元素
- label: 字段标签，[字号、颜色、必填星号]
- helper: 辅助说明文字，[字号、颜色]
- error-msg: 错误提示，红色，[位置]
- field-group: 多字段一行（如 姓名+姓氏）

## brand
<!-- section: brand -->

### ai-prompt
<!-- type: ai-prompt -->
[用英文描述视觉风格，可直接用于 Midjourney/DALL-E，100词以内]

### personality
<!-- type: list -->
- [气质词1]
- [气质词2]
- [气质词3]

重要：根据用户描述的审美推断具体色值，不要询问颜色。ai-prompt 字段必须用英文。所有组件的描述和注释必须与整体设计风格保持一致，体现品味差异化。`

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
