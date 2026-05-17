'use client'

import type { DesignAST } from '@/lib/parser/types'
import SectionBlock from './SectionBlock'

interface Props {
  ast: DesignAST
  onTokenClick?: (line: number) => void
  /** Highlighted line from editor cursor */
  highlightedLine?: number
}

const sectionIcons: Record<string, string> = {
  'design-language': '✦',
  'colors': '◉',
  'typography': 'Aa',
  'spacing': '⬜',
  'borders': '⬡',
  'shadows': '◫',
  'motion': '▷',
  'components': '⬛',
  'illustration-style': '◈',
  'icon-style': '◆',
  'ai-context': '⌘',
}

export default function PreviewPanel({ ast, onTokenClick, highlightedLine }: Props) {
  if (!ast.sections.length) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-neutral-400 gap-3">
        <div className="text-4xl">◎</div>
        <p className="text-sm">在左侧粘贴 DESIGN.md 内容，这里会实时渲染可视化预览</p>
      </div>
    )
  }

  return (
    <div className="h-full overflow-y-auto">
      {/* Header */}
      <div className="px-8 pt-8 pb-6 border-b border-neutral-100">
        <h1 className="text-2xl font-bold text-neutral-900">
          {ast.meta.project ?? 'Design System'}
        </h1>
        {ast.meta.description && (
          <p className="text-sm text-neutral-500 mt-1">{ast.meta.description}</p>
        )}
        {ast.meta.version && (
          <span className="inline-block mt-2 text-xs font-mono text-neutral-400 bg-neutral-100 px-2 py-0.5 rounded-full">
            v{ast.meta.version}
          </span>
        )}
      </div>

      {/* Sections */}
      <div className="px-8 py-6 space-y-10">
        {ast.sections.map((section) => {
          if (!section.subsections.length) return null
          const icon = sectionIcons[section.id] ?? '◦'

          return (
            <section key={section.id} id={`section-${section.id}`}>
              {/* Section header */}
              <div className="flex items-center gap-2 mb-5">
                <span className="text-sm text-indigo-400 font-medium w-6 text-center">{icon}</span>
                <h2 className="text-lg font-semibold text-neutral-800">{section.title}</h2>
                <div className="flex-1 h-px bg-neutral-100 ml-2" />
              </div>

              {/* Subsections */}
              <div className="pl-8 space-y-6">
                {section.subsections.map((sub) => (
                  <SectionBlock
                    key={sub.id}
                    subsection={sub}
                    onTokenClick={onTokenClick}
                  />
                ))}
              </div>
            </section>
          )
        })}
      </div>

      {/* Footer */}
      <div className="px-8 py-6 border-t border-neutral-100 text-center">
        <p className="text-xs text-neutral-400">
          由 <span className="font-medium text-indigo-500">TasteDNA</span> 生成 · 基于 DESIGN.md 规范
        </p>
      </div>
    </div>
  )
}
