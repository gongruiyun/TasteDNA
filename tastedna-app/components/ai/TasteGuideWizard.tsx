'use client'

import { useState } from 'react'

const STEPS = [
  {
    id: 'productType',
    question: '产品形态是什么？',
    hint: '影响交互密度和设计侧重',
    type: 'single' as const,
    options: [
      { label: '消费 App', sub: 'iOS · Android · 移动端', value: '消费App，移动优先，注重情绪体验和流畅感' },
      { label: 'B2B SaaS', sub: '工具 · 后台 · 数据看板', value: 'B2B SaaS工具，注重效率、信息层级和信任感' },
      { label: 'AI / Agent', sub: '对话 · 推理 · 自动化', value: 'AI对话或Agent产品，注重对话界面、流式输出体验和工具调用展示' },
      { label: '开发者工具', sub: 'SDK · 文档 · 控制台', value: '开发者工具或平台，注重代码可读性、技术质感和信息密度' },
      { label: '创作 / 协作', sub: '设计 · 写作 · 知识管理', value: '创作或协作工具，注重画布感、层级操控和多人协作状态' },
      { label: '品牌官网', sub: '落地页 · 展示 · 转化', value: '品牌官网或落地页，注重第一印象和品牌传达' },
      { label: '内容平台', sub: '媒体 · 博客 · 知识库', value: '内容/媒体平台，注重阅读体验和内容消费' },
      { label: '电商零售', sub: '商品 · 选购 · 购物车', value: '电商零售平台，注重商品展示和购买转化' },
      { label: '奢侈 / 高端', sub: '精品 · 品牌 · 高客单', value: '奢侈品或高端品牌，注重质感、排他感和物质性' },
    ],
  },
  {
    id: 'vibe',
    question: '整体气质更接近哪种？',
    hint: '不一定是同行业，选最有感觉的',
    type: 'single' as const,
    options: [
      { label: '终端极客', sub: 'monospace · 命令行审美 · 代码即设计 — Cursor / Warp / Zed', value: 'terminal-hacker：终端极客，等宽字体主导，深色底浅色文字，命令行审美，代码感强，开发者身份标签' },
      { label: '智性透明', sub: '毛玻璃 · 思考过程可见 · 克制有深度 — Claude / Perplexity / Arc', value: 'intelligent-transparent：智性透明，毛玻璃与半透明层叠，思考过程可视化，光影细腻，信息呼吸感强，克制而有深度' },
      { label: '生成感美学', sub: '流体渐变 · 噪点质感 · 有机不完美 — Midjourney / Runway / ElevenLabs', value: 'generative-aesthetic：生成感美学，流体渐变色块，噪点纹理，有机形态，动态流动感，AI生成过程可见，不追求像素完美' },
      { label: '冷峻精密', sub: '大量留白 · 极少装饰 · 近乎单色 — Apple / Linear / Vercel', value: 'minimal-precision：冷峻精密，大量留白，几何无衬线，近乎无色的单色调，每个元素都有存在理由' },
      { label: '暗色科技', sub: '深底亮字 · 渐变光晕 · 层次丰富 — Stripe / GitHub / Cosmos', value: 'dark-tech：深色背景，渐变光晕，高对比，技术先锋感，层次丰富，现代几何字体' },
      { label: '温暖亲和', sub: '有机感 · 大地暖色 · 柔和无衬线 — Notion / Airbnb / Loom', value: 'warm-humanist：温暖亲和，有机感，大地暖色，衬线或柔和无衬线字体，让人放松' },
      { label: '活力撞色', sub: '高饱和 · 大胆配色 · 紧凑有节奏 — Duolingo / Framer / Pitch', value: 'playful-bold：活力撞色，高饱和，不怕出错，粗壮有性格字体，紧凑有节奏感' },
      { label: '专业可信', sub: '蓝色系 · 结构清晰 · 稳重可靠 — Atlassian / Salesforce / Workday', value: 'professional-trust：专业可信，蓝色系，结构清晰，信息层级严谨，可靠稳重，低饱和' },
      { label: '东方禅意', sub: '留白即设计 · 内敛水墨 · 方正细体 — Muji / 少数派 / 得到', value: 'eastern-zen：东方禅意，留白即设计，水墨气质，内敛克制，方正细体，减法美学' },
      { label: '无声奢华', sub: '米白燕麦 · 细衬线宽字距 · 极少文字 — Hermès / The Row / Bottega', value: 'quiet-luxury：无声奢华，米白燕麦色，大量留白，极少文字，细衬线宽字距，物质质感强' },
      { label: '工业美学', sub: '哑光灰黑 · 功能主义 · 产品为主角 — Braun / Nothing / Teenage Engineering', value: 'industrial-craft：工业美学，哑光灰黑，产品为主角，等宽工程感字体，功能主义，形式服从功能' },
    ],
  },
  {
    id: 'emotion',
    question: '用户打开产品，第一秒感受到什么？',
    hint: '选最重要的那一个',
    type: 'single' as const,
    options: [
      { label: '被赋能，感觉变厉害了', sub: '增强感 · 超能力 · 我变强了 — Cursor / Copilot / Perplexity', value: '被赋能感，用了以后感觉自己能力被放大，像获得了超能力' },
      { label: '被读懂，它比我更懂我', sub: '意图理解 · 心有灵犀 · AI 共鸣 — Claude / ChatGPT / Gemini', value: '被深度理解，AI精准捕捉意图，心有灵犀，不需要解释太多' },
      { label: '专注，干什么就干什么', sub: '极简 · 零干扰 · 心无旁骛 — Linear / Things / Bear', value: '极度专注，无干扰，心流状态' },
      { label: '安心，放心把它交给它', sub: '稳定 · 可靠 · 安全感 — 1Password / Stripe / Notion', value: '信任感和安全感，稳定可靠' },
      { label: '惊喜，忍不住多探索', sub: '新奇 · 愉悦 · 探索欲 — Duolingo / Framer / Pitch', value: '惊喜感和探索欲，愉悦有趣' },
      { label: '温暖，感觉被理解', sub: '亲切 · 包容 · 有人情味 — Airbnb / Loom / Day One', value: '温暖亲切，有人情味，被理解' },
      { label: '专业，一切都在掌握中', sub: '清晰 · 有条理 · 掌控感 — Figma / Raycast / Atlassian', value: '专业清晰，有条理，掌控全局' },
      { label: '酷，用了有点与众不同', sub: '个性 · 品味 · 身份标签 — Arc / Cosmos / Teenage Eng', value: '酷且有品味，彰显个性与身份' },
      { label: '高效，直接搞定', sub: '快速 · 无摩擦 · 省时间 — Vercel / Clerk / Resend', value: '高效直接，无摩擦，节省时间' },
      { label: '平静，轻松就能用', sub: '舒适 · 低压力 · 无负担 — Calm / Headspace / Forest', value: '平静轻松，低压力，无负担' },
    ],
  },
  {
    id: 'avoid',
    question: '有特别想避开的雷区吗？',
    hint: '可多选，选越多越准；没有也可以直接跳过',
    type: 'multi' as const,
    options: [
      { label: '太 corporate', sub: '正式呆板，像 PPT 模板', value: '太corporate正式呆板' },
      { label: '太可爱', sub: '幼稚插画，圆乎乎', value: '太可爱幼稚插画风' },
      { label: '太复杂', sub: 'Notion 式信息过载', value: '太复杂信息过载' },
      { label: '太冷漠', sub: '机器感，没有温度', value: '太冷漠没有温度' },
      { label: '太花哨', sub: '渐变加特效，过度设计', value: '太花哨过度设计' },
      { label: '太普通', sub: '看不出有设计过', value: '太普通毫无个性' },
      { label: '太商业廉价', sub: '广告模板，无品牌感', value: '太商业廉价感，像广告模板' },
      { label: '太数字感', sub: '屏幕感强，缺乏物质质感', value: '太数字化，缺乏物质质感和工艺感' },
    ],
  },
  {
    id: 'visual',
    question: '视觉语言偏好',
    hint: '每个维度选一个',
    type: 'groups' as const,
    groups: [
      {
        label: '明暗基调',
        options: [
          { label: '浅色系', value: '浅色/白色背景为主' },
          { label: '深色系', value: '深色/暗色背景为主' },
          { label: '明暗双模', value: '同时支持浅色和深色模式' },
        ],
      },
      {
        label: '色彩倾向',
        options: [
          { label: '高饱和活力', value: '高饱和，鲜明色彩，视觉冲击力强' },
          { label: '低饱和克制', value: '低饱和，克制配色，专业内敛' },
          { label: '大地暖色', value: '大地色系，暖调，有机自然感' },
          { label: '单色极简', value: '接近单色，黑白灰为主，极简主义' },
        ],
      },
      {
        label: '空间感',
        options: [
          { label: '大量留白', value: '大量留白，呼吸感强，高端克制' },
          { label: '中等密度', value: '中等信息密度，平衡感好' },
          { label: '信息密集', value: '紧凑布局，信息密度高，效率优先' },
        ],
      },
      {
        label: '字体风格',
        options: [
          { label: '几何无衬线', value: '几何无衬线字体，精准现代，如 Inter / DM Sans' },
          { label: '人文衬线', value: '人文衬线字体，有温度有故事感，如 Lora / Playfair' },
          { label: '等宽代码感', value: '等宽或技术感字体，开发者/极客氛围' },
        ],
      },
      {
        label: '形态语言',
        options: [
          { label: '锐利精准', value: '直角或极小圆角，硬朗精准，工具感强' },
          { label: '中性平衡', value: '适中圆角，现代通用，不强调风格' },
          { label: '圆润亲和', value: '大圆角，圆润柔和，亲切有温度' },
        ],
      },
      {
        label: '图像风格',
        options: [
          { label: '写实摄影', value: '高质量实物或人物摄影，真实质感' },
          { label: '3D 渲染插画', value: '3D 渲染风格插画，如 Notion / Linear / Luma' },
          { label: '扁平人物插画', value: '扁平风格人物插画，如 Mailchimp / Slack / Intercom' },
          { label: '线稿细腻风', value: '精细线条插画，如 Google / Stripe 风格' },
          { label: '渐变流体', value: '渐变色块与流体形状，AI 品牌氛围感，如 Figma / Framer' },
          { label: '等距立体', value: '等距视角 3D 插画，多用于 SaaS 信息图' },
          { label: '几何抽象', value: '极简几何图形或品牌抽象色块' },
          { label: '纯排版', value: '无插图，文字即设计，如 Apple / Vercel' },
        ],
      },
    ],
  },
]

interface WizardSelections {
  productType: string
  vibe: string
  emotion: string
  avoid: string[]
  visual: Record<string, string>
  productName: string
}

interface Props {
  onGenerate: (prompt: string) => void
}

export default function TasteGuideWizard({ onGenerate }: Props) {
  const [step, setStep] = useState(0)
  const [selections, setSelections] = useState<WizardSelections>({
    productType: '', vibe: '', emotion: '', avoid: [], visual: {}, productName: '',
  })

  const currentStep = STEPS[step]
  const totalSteps = STEPS.length

  const toggleMulti = (value: string) => {
    setSelections(prev => ({
      ...prev,
      avoid: prev.avoid.includes(value)
        ? prev.avoid.filter(v => v !== value)
        : [...prev.avoid, value],
    }))
  }

  const toggleGroup = (groupLabel: string, value: string) => {
    setSelections(prev => ({
      ...prev,
      visual: { ...prev.visual, [groupLabel]: prev.visual[groupLabel] === value ? '' : value },
    }))
  }

  const canNext = () => {
    if (currentStep.id === 'productType') return !!selections.productType
    if (currentStep.id === 'vibe') return !!selections.vibe
    if (currentStep.id === 'emotion') return !!selections.emotion
    if (currentStep.id === 'avoid') return true
    if (currentStep.id === 'visual') return Object.values(selections.visual).some(Boolean)
    return false
  }

  const handleGenerate = () => {
    const visualDesc = Object.entries(selections.visual)
      .filter(([, v]) => v)
      .map(([k, v]) => `${k}：${v}`)
      .join('，')

    const prompt = `请根据以下用户选择的品味偏好，直接生成完整的 DESIGN.md 文件（跳过DNA总结步骤，直接输出）：

产品名称：${selections.productName || '待定'}
产品形态：${selections.productType}
整体气质：${selections.vibe}
情绪目标：用户打开时感受到${selections.emotion}
绝对避免：${selections.avoid.join('、')}
视觉语言：${visualDesc || '无特殊偏好'}

请直接输出符合 TasteDNA DESIGN.md 格式的完整设计规范文件。`

    onGenerate(prompt)
  }

  return (
    <div className="flex flex-col px-4 py-3">
      {/* Progress */}
      <div className="flex items-center gap-2 mb-3">
        <div className="flex gap-1">
          {STEPS.map((_, i) => (
            <div
              key={i}
              className="h-1 rounded-full transition-all"
              style={{
                width: i <= step ? '16px' : '8px',
                backgroundColor: i < step ? 'var(--ink)' : i === step ? 'var(--brand-lavender)' : 'var(--hairline)',
              }}
            />
          ))}
        </div>
        <span className="text-[10px] ml-auto" style={{ color: 'var(--muted-soft)' }}>{step + 1} / {totalSteps}</span>
      </div>

      {/* Product name — only on step 0 */}
      {step === 0 && (
        <div className="mb-3">
          <input
            value={selections.productName}
            onChange={e => setSelections(prev => ({ ...prev, productName: e.target.value }))}
            placeholder="产品名称（可选）"
            className="w-full text-xs border rounded-lg px-3 py-2 focus:outline-none"
            style={{ backgroundColor: 'var(--canvas)', borderColor: 'var(--hairline)', color: 'var(--body-strong)' }}
          />
        </div>
      )}

      {/* Question */}
      <div className="mb-2.5">
        <p className="text-[13px] font-semibold" style={{ color: 'var(--ink)' }}>{currentStep.question}</p>
        <p className="text-[11px] mt-0.5" style={{ color: 'var(--muted)' }}>{currentStep.hint}</p>
      </div>

      {/* Options */}
      <div className="pb-2">
        {currentStep.type === 'single' && (
          <div className="grid grid-cols-2 gap-1">
            {currentStep.options.map(opt => {
              const selected = selections[currentStep.id as 'productType' | 'vibe' | 'emotion'] === opt.value
              return (
                <button
                  key={opt.value}
                  onClick={() => setSelections(prev => ({ ...prev, [currentStep.id]: opt.value }))}
                  className="text-left px-3 py-2 rounded-xl border transition-all"
                  style={selected
                    ? { backgroundColor: 'var(--ink)', borderColor: 'var(--ink)', color: '#ffffff' }
                    : { backgroundColor: 'var(--canvas)', borderColor: 'var(--hairline)', color: 'var(--body)' }}
                >
                  <div className="text-[12px] font-medium">{opt.label}</div>
                  {'sub' in opt && <div className="text-[10px] mt-0.5 leading-tight" style={{ color: selected ? 'rgba(255,255,255,0.6)' : 'var(--muted)' }}>{opt.sub}</div>}
                </button>
              )
            })}
          </div>
        )}

        {currentStep.type === 'multi' && (
          <div className="grid grid-cols-2 gap-1">
            {currentStep.options.map(opt => {
              const selected = selections.avoid.includes(opt.value)
              return (
                <button
                  key={opt.value}
                  onClick={() => toggleMulti(opt.value)}
                  className="text-left px-3 py-2 rounded-xl border transition-all"
                  style={selected
                    ? { backgroundColor: 'var(--ink)', borderColor: 'var(--ink)', color: '#ffffff' }
                    : { backgroundColor: 'var(--canvas)', borderColor: 'var(--hairline)', color: 'var(--body)' }}
                >
                  <div className="text-[12px] font-medium">{opt.label}</div>
                  {'sub' in opt && <div className="text-[10px] mt-0.5 leading-tight" style={{ color: selected ? 'rgba(255,255,255,0.6)' : 'var(--muted)' }}>{opt.sub}</div>}
                </button>
              )
            })}
          </div>
        )}

        {currentStep.type === 'groups' && (
          <div className="space-y-2">
            {currentStep.groups.map(group => (
              <div key={group.label}>
                <p className="text-[10px] font-semibold uppercase tracking-wide mb-1" style={{ color: 'var(--muted-soft)' }}>{group.label}</p>
                <div className="flex flex-wrap gap-1">
                  {group.options.map(opt => {
                    const selected = selections.visual[group.label] === opt.value
                    return (
                      <button
                        key={opt.value}
                        onClick={() => toggleGroup(group.label, opt.value)}
                        className="px-2.5 py-1 rounded-lg border text-[11px] font-medium transition-all"
                        style={selected
                          ? { backgroundColor: 'var(--ink)', borderColor: 'var(--ink)', color: '#ffffff' }
                          : { backgroundColor: 'var(--canvas)', borderColor: 'var(--hairline)', color: 'var(--body)' }}
                      >
                        {opt.label}
                      </button>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Navigation */}
      <div className="flex gap-2 mt-3">
        {step > 0 && (
          <button
            onClick={() => setStep(s => s - 1)}
            className="px-3 py-1.5 rounded-lg text-[11px] font-medium transition-opacity hover:opacity-70"
            style={{ backgroundColor: 'var(--surface-card)', color: 'var(--muted)' }}
          >
            上一步
          </button>
        )}
        {step < totalSteps - 1 ? (
          <button
            onClick={() => setStep(s => s + 1)}
            disabled={!canNext()}
            className="flex-1 py-1.5 rounded-lg text-[11px] font-semibold text-white disabled:opacity-40 transition-opacity hover:opacity-80"
            style={{ backgroundColor: 'var(--ink)' }}
          >
            下一步
          </button>
        ) : (
          <button
            onClick={handleGenerate}
            disabled={!canNext()}
            className="flex-1 py-1.5 rounded-lg text-[11px] font-semibold text-white disabled:opacity-40 transition-opacity hover:opacity-80"
            style={{ backgroundColor: 'var(--ink)' }}
          >
            ✦ 生成 DESIGN.md
          </button>
        )}
      </div>
    </div>
  )
}
