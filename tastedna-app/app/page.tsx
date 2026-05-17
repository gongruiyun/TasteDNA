import Link from 'next/link'

export default function HomePage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-neutral-50 to-indigo-50/30 flex flex-col">
      {/* Nav */}
      <nav className="h-14 flex items-center px-8 border-b border-neutral-200 bg-white/80 backdrop-blur-sm sticky top-0 z-10">
        <span className="text-base font-bold text-neutral-900">TasteDNA</span>
        <div className="flex-1" />
        <Link
          href="/editor"
          className="text-sm font-medium text-indigo-600 hover:text-indigo-700 transition-colors"
        >
          打开编辑器 →
        </Link>
      </nav>

      {/* Hero */}
      <section className="flex-1 flex flex-col items-center justify-center px-6 py-20 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-100 text-xs font-medium text-indigo-600 mb-6">
          ✦ 为 AI 时代的设计师而生
        </div>

        <h1 className="text-5xl font-extrabold text-neutral-900 leading-tight max-w-2xl mb-6">
          把设计直觉<br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-purple-500">
            翻译成 AI 能读懂的语言
          </span>
        </h1>

        <p className="text-lg text-neutral-500 max-w-xl mb-10 leading-relaxed">
          编写 DESIGN.md，实时看到色彩、字体、间距、动效的完整可视化。
          点击任意元素定位到代码，一键生成 AI Prompt，把设计风格分享给同事。
        </p>

        <div className="flex items-center gap-4">
          <Link
            href="/editor"
            className="px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-sm transition-colors shadow-lg shadow-indigo-200"
          >
            从模板开始 →
          </Link>
        </div>
      </section>

      {/* Feature grid */}
      <section className="max-w-4xl mx-auto px-6 pb-20 grid grid-cols-1 sm:grid-cols-3 gap-4 w-full">
        {[
          {
            icon: '◉',
            title: '实时可视化',
            desc: '颜色、字体、间距、阴影、动效，所有 token 即写即见。',
          },
          {
            icon: '↕',
            title: '双向定位',
            desc: '点击色块跳到对应 markdown 行，改代码实时刷新预览。',
          },
          {
            icon: '⌘',
            title: '一键 AI Prompt',
            desc: '自动提取设计语言摘要，直接粘贴给任何 AI 开始 vibecoding。',
          },
        ].map((f) => (
          <div key={f.title} className="rounded-2xl bg-white border border-neutral-200 p-6">
            <div className="text-2xl text-indigo-400 mb-3">{f.icon}</div>
            <h3 className="text-sm font-semibold text-neutral-800 mb-1">{f.title}</h3>
            <p className="text-xs text-neutral-500 leading-relaxed">{f.desc}</p>
          </div>
        ))}
      </section>
    </main>
  )
}
