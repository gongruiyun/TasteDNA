import Link from 'next/link'

const TOOLS = [
  {
    id: 'design-system',
    icon: '✦',
    name: '设计规范',
    nameEn: 'DESIGN.md',
    desc: '支持 AI 编写 DESIGN.md，实时可视化色彩、字体、间距、动效，一键生成 AI Prompt。',
    features: ['实时预览', '双向定位', 'AI Prompt'],
    available: true,
    href: '/editor',
    cta: '开始使用 →',
    cardBg: 'linear-gradient(to bottom, #f5c9a0 0%, #dff0ed 50%, #e8b4c4 100%)',
    textColor: '#0a0a0a',
    tagBg: 'rgba(10,10,10,0.1)',
    tagColor: '#0a0a0a',
    iconBg: 'rgba(10,10,10,0.12)',
  },
  {
    id: 'icon-style',
    icon: '◈',
    name: 'Icon 风格',
    nameEn: 'Icon Style',
    desc: '描述你的品牌气质，生成一整套风格统一的 SVG 图标，直接导出使用。',
    features: ['风格定义', 'SVG 导出', '批量生成'],
    available: true,
    href: '/icon',
    cta: '开始使用 →',
    cardBg: 'linear-gradient(to bottom, #c8dff5 0%, #d4e8d4 50%, #f5e8c8 100%)',
    textColor: '#0a0a0a',
    tagBg: 'rgba(10,10,10,0.1)',
    tagColor: '#0a0a0a',
    iconBg: 'rgba(10,10,10,0.12)',
  },
  {
    id: 'skill-writer',
    icon: '⌘',
    name: 'Skill 编写',
    nameEn: 'Skill Writer',
    desc: '上传设计规范、Token、组件文档，自动生成结构化 AI Skill 包，让 AI 编码时引用真实设计真相。',
    features: ['Token 提取', 'Skill 打包', 'SoT 强制'],
    available: true,
    href: '/skill',
    cta: '开始使用 →',
    cardBg: 'linear-gradient(to bottom, #e8e0f5 0%, #f0e8f8 50%, #dde8f5 100%)',
    textColor: '#0a0a0a',
    tagBg: 'rgba(10,10,10,0.1)',
    tagColor: '#0a0a0a',
    iconBg: 'rgba(10,10,10,0.12)',
  },
]

export default function HomePage() {
  return (
    <main
      className="min-h-screen flex flex-col"
      style={{
        backgroundColor: 'var(--canvas)',
        backgroundImage: 'radial-gradient(circle, rgba(0,0,0,0.09) 1px, transparent 1px)',
        backgroundSize: '24px 24px',
      }}
    >
      {/* Nav */}
      <nav style={{ backgroundColor: 'var(--canvas)', borderBottom: '1px solid var(--hairline)' }}
        className="h-16 flex items-center px-8 sticky top-0 z-10 backdrop-blur-sm">
        <div className="flex items-baseline gap-2.5">
          <span className="text-base font-semibold tracking-tight" style={{ color: 'var(--ink)' }}>
            TasteDNA
          </span>
          <span className="text-xs" style={{ color: 'var(--muted)' }}>设计师 AI 工具箱</span>
        </div>
      </nav>

      {/* Hero */}
      <section className="flex flex-col items-center pt-20 pb-16 px-6 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-[11px] font-medium tracking-wide mb-8"
          style={{ backgroundColor: 'var(--surface-card)', color: 'var(--muted)', border: '1px solid var(--hairline)' }}>
          <span className="w-1.5 h-1.5 rounded-full inline-block" style={{ backgroundColor: 'var(--brand-ochre)' }} />
          为 AI 时代的设计师而生
        </div>

        <h1 className="display text-[56px] mb-5 max-w-2xl" style={{ color: 'var(--ink)', lineHeight: 1.2 }}>
          把设计直觉<br />
          翻译成 AI 能读懂的语言
        </h1>

        <p className="text-base leading-relaxed whitespace-nowrap" style={{ color: 'var(--muted)', fontWeight: 400 }}>
          一套 AI 原生的设计语言工具，帮你定义、沉淀和传递品牌风格。
        </p>
      </section>

      {/* Tool cards */}
      <section className="flex-1 mx-auto px-6 pb-24 w-full" style={{ maxWidth: '960px' }}>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {TOOLS.map((tool) => (
            <div key={tool.id} className="relative flex flex-col p-8"
              style={{
                background: tool.cardBg,
                borderRadius: '24px',
                opacity: tool.available ? 1 : 0.7,
              }}>

              {!tool.available && (
                <span className="absolute top-5 right-5 text-[10px] font-semibold px-2.5 py-1 tracking-wide"
                  style={{ backgroundColor: 'rgba(10,10,10,0.08)', color: 'var(--muted)', borderRadius: '9999px' }}>
                  即将上线
                </span>
              )}

              <div className="w-10 h-10 flex items-center justify-center text-base mb-5"
                style={{ backgroundColor: tool.iconBg, borderRadius: '12px', color: tool.textColor }}>
                {tool.icon}
              </div>

              <div className="mb-3">
                <h2 className="text-lg font-semibold" style={{ color: tool.textColor, letterSpacing: '-0.02em' }}>
                  {tool.name}
                </h2>
                <p className="text-[11px] font-mono mt-0.5" style={{ color: tool.available ? 'rgba(10,10,10,0.45)' : 'var(--muted-soft)' }}>
                  {tool.nameEn}
                </p>
              </div>

              <p className="text-xs leading-relaxed mb-6 flex-1" style={{ color: tool.available ? 'rgba(10,10,10,0.6)' : 'var(--muted-soft)' }}>
                {tool.desc}
              </p>

              <div className="flex flex-wrap gap-1.5 mb-6">
                {tool.features.map(f => (
                  <span key={f} className="text-[10px] font-medium px-2.5 py-1"
                    style={{ backgroundColor: tool.tagBg, color: tool.tagColor, borderRadius: '9999px' }}>
                    {f}
                  </span>
                ))}
              </div>

              {tool.available ? (
                <Link href={tool.href!}
                  className="w-full text-center py-3 text-sm font-semibold transition-opacity hover:opacity-80"
                  style={{ backgroundColor: 'var(--ink)', color: '#ffffff', borderRadius: '12px' }}>
                  {tool.cta}
                </Link>
              ) : (
                <button disabled
                  className="w-full text-center py-3 text-sm font-medium cursor-not-allowed"
                  style={{ backgroundColor: 'rgba(10,10,10,0.06)', color: 'var(--muted-soft)', borderRadius: '12px' }}>
                  {tool.cta}
                </button>
              )}
            </div>
          ))}
        </div>
      </section>
    </main>
  )
}
