'use client'

import { useEffect, useRef } from 'react'
import type { DesignAST } from '@/lib/parser/types'
import SectionBlock from './SectionBlock'
import { useLanguage } from '@/lib/i18n'

interface Props {
  ast: DesignAST
  onTokenClick?: (line: number) => void
  onTokenColorChange?: (line: number, color: string) => void
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

export default function PreviewPanel({ ast, onTokenClick, onTokenColorChange, highlightedLine }: Props) {
  const { t } = useLanguage()
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (highlightedLine == null || !scrollRef.current) return

    // Find the deepest section whose start <= cursor
    let matchedSection = null
    for (const section of ast.sections) {
      if (section.line.start <= highlightedLine) matchedSection = section
      else break
    }
    if (!matchedSection) return

    // Find deepest matching subsection
    let targetId = `section-${matchedSection.id}`
    for (const sub of matchedSection.subsections) {
      if (sub.line.start <= highlightedLine) targetId = `subsection-${sub.id}-${matchedSection.id}`
      else break
    }

    const container = scrollRef.current.querySelector(`#${CSS.escape(targetId)}`)
    if (!container) return

    // Token-level: find the [data-line] element whose line is closest to (but not past) cursor
    const dataLineEls = Array.from(container.querySelectorAll<HTMLElement>('[data-line]'))
    let bestEl: HTMLElement | null = null
    let bestLine = -1
    for (const el of dataLineEls) {
      const dl = parseInt(el.getAttribute('data-line') ?? '0', 10)
      if (dl <= highlightedLine && dl > bestLine) {
        bestLine = dl
        bestEl = el
      }
    }

    if (bestEl) {
      // 'nearest' = don't scroll if already visible; only nudge if off-screen
      bestEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
    } else {
      // Fallback to subsection header
      container.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }, [highlightedLine, ast])

  if (!ast.sections.length) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-neutral-400 gap-3">
        <div className="text-4xl">◎</div>
        <p className="text-sm">{t('previewPlaceholder')}</p>
      </div>
    )
  }

  return (
    <div ref={scrollRef} className="h-full overflow-y-auto">

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
        {ast.sections.map((section, sIdx) => {
          if (!section.subsections.length) return null
          const icon = sectionIcons[section.id] ?? '◦'

          return (
            <section key={`${section.id}-${sIdx}`} id={`section-${section.id}`}>
              {/* Section header */}
              <div className="flex items-center gap-2 mb-5">
                <span className="text-sm text-indigo-400 font-medium w-6 text-center">{icon}</span>
                <h2 className="text-lg font-semibold text-neutral-800">{section.title}</h2>
                <div className="flex-1 h-px bg-neutral-100 ml-2" />
              </div>

              {/* Subsections */}
              <div className="pl-8 space-y-6">
                {section.subsections.map((sub, subIdx) => (
                  <div key={`${sub.id}-${subIdx}`} id={`subsection-${sub.id}-${section.id}`}>
                    <SectionBlock
                      subsection={sub}
                      sectionId={section.id}
                      onTokenClick={onTokenClick}
                      onTokenColorChange={onTokenColorChange}
                    />
                  </div>
                ))}
              </div>
            </section>
          )
        })}
      </div>

      {/* Footer */}
      <div className="px-8 py-6 border-t border-neutral-100 text-center">
        <p className="text-xs text-neutral-400">{t('previewFooter')}</p>
      </div>
    </div>
  )
}
