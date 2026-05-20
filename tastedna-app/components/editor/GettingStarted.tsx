'use client'

import { useLanguage } from '@/lib/i18n'
import { STARTER_TEMPLATE } from '@/lib/templates'

interface Props {
  onLoadStarter: (content: string) => void
}

const syntaxBlocks = [
  {
    title: '文件头 (frontmatter)',
    titleEn: 'File Header (frontmatter)',
    code: `---
meta:
  project: "My App"
  version: "1.0.0"
---`,
  },
  {
    title: '章节 (H2 + 注释)',
    titleEn: 'Section (H2 + comment)',
    code: `## colors
<!-- section: colors -->`,
  },
  {
    title: '子区块 (H3 + 类型)',
    titleEn: 'Subsection (H3 + type)',
    code: `### brand
<!-- type: color-group -->
- primary: #4F6EF7  // 品牌主色`,
  },
  {
    title: '可用的 type 值',
    titleEn: 'Available type values',
    code: `color-group   → 色块卡片
color-scale   → 色阶条
gradient-group→ 渐变预览
scale         → 数值比例
shadow-scale  → 阴影预览
easing-group  → 贝塞尔曲线
font-list     → 字体列表
text          → 纯文本段落
ai-prompt     → AI 提示词`,
  },
]

export default function GettingStarted({ onLoadStarter }: Props) {
  const { lang } = useLanguage()
  const zh = lang === 'zh'

  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-lg mx-auto px-8 py-12">
        {/* Hero */}
        <div className="text-center mb-10">
          <div className="text-4xl mb-4">◎</div>
          <h2 className="text-xl font-bold text-neutral-800 mb-2">
            {zh ? '开始你的第一份 DESIGN.md' : 'Start your first DESIGN.md'}
          </h2>
          <p className="text-sm text-neutral-500">
            {zh
              ? 'TasteDNA 使用一种结构化的 Markdown 格式，在左侧编写，右侧实时渲染为视觉预览。'
              : 'TasteDNA uses a structured Markdown format. Write on the left, see the visual preview on the right in real time.'}
          </p>
        </div>

        {/* Load starter button */}
        <button
          onClick={() => onLoadStarter(STARTER_TEMPLATE)}
          className="w-full mb-10 py-3 rounded-xl text-sm font-medium transition-colors"
          style={{ backgroundColor: '#4F6EF715', color: '#4F6EF7' }}
          onMouseOver={e => (e.currentTarget.style.backgroundColor = '#4F6EF725')}
          onMouseOut={e => (e.currentTarget.style.backgroundColor = '#4F6EF715')}
        >
          {zh ? '⚡ 加载入门模板，快速开始' : '⚡ Load starter template'}
        </button>

        {/* Syntax guide */}
        <h3 className="text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-4">
          {zh ? '语法速查' : 'Syntax reference'}
        </h3>

        <div className="space-y-4">
          {syntaxBlocks.map((block) => (
            <div key={block.title} className="rounded-xl border border-neutral-100 overflow-hidden">
              <div className="px-4 py-2 bg-neutral-50 border-b border-neutral-100">
                <p className="text-xs font-medium text-neutral-500">
                  {zh ? block.title : block.titleEn}
                </p>
              </div>
              <pre className="px-4 py-3 text-xs font-mono text-neutral-700 leading-relaxed overflow-x-auto bg-white">
                {block.code}
              </pre>
            </div>
          ))}
        </div>

        {/* Tips */}
        <div className="mt-8 p-4 rounded-xl bg-amber-50 border border-amber-100">
          <p className="text-xs font-semibold text-amber-700 mb-2">
            {zh ? '💡 小技巧' : '💡 Tips'}
          </p>
          <ul className="text-xs text-amber-700 space-y-1 list-disc list-inside">
            <li>{zh ? '点击右侧色块可跳转到对应行' : 'Click a swatch to jump to its line in the editor'}</li>
            <li>{zh ? 'Hover 色块后点 ✎ 可直接选色' : 'Hover a swatch and click ✎ to pick a color'}</li>
            <li>{zh ? '顶部"插入模块"可快速添加各种区块' : 'Use "Insert Block" in the header to add sections quickly'}</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
