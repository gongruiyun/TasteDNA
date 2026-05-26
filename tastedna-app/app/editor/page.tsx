'use client'

import { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import dynamic from 'next/dynamic'
import { parseDESIGNMD } from '@/lib/parser'
import PreviewPanel from '@/components/preview/PreviewPanel'
import EditorLayout from '@/components/layout/EditorLayout'
import { saveDesignMD, loadDesignMD } from '@/lib/utils/storage'
import { copyText } from '@/lib/utils/clipboard'
import type { CodeEditorHandle } from '@/components/editor/CodeEditor'
import { useLanguage } from '@/lib/i18n'
import TemplateMenu from '@/components/editor/TemplateMenu'
import GettingStarted from '@/components/editor/GettingStarted'
import AIChatPanel from '@/components/ai/AIChatPanel'
import { exportToSkill } from '@/lib/skill-exporter'
import { exportToCSS } from '@/lib/css-exporter'
import { Panel, PanelGroup, PanelResizeHandle, type ImperativePanelHandle } from 'react-resizable-panels'

const CodeEditor = dynamic(() => import('@/components/editor/CodeEditor'), { ssr: false })

const DEBOUNCE_MS = 300

function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(timer)
  }, [value, delay])
  return debounced
}

// ── Format help popover: ? button with usage guide ────────────────────────
function FormatHelp() {
  return (
    <div className="relative group/help">
      {/* Trigger */}
      <button
        className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium leading-none transition-opacity hover:opacity-70"
        style={{
          border: '1px solid var(--hairline)',
          backgroundColor: 'var(--surface-card)',
          color: 'var(--muted)',
        }}
      >
        ?
      </button>

      {/* Popover — drops below header */}
      <div
        className="absolute top-full right-0 mt-2 w-[296px] rounded-xl pointer-events-none z-50 opacity-0 group-hover/help:opacity-100 transition-opacity duration-200"
        style={{
          backgroundColor: 'var(--ink)',
          color: '#fff',
          boxShadow: '0 8px 32px rgba(0,0,0,0.28)',
        }}
      >
        {/* Arrow pointing up, aligned to button */}
        <span
          className="absolute bottom-full right-[9px]"
          style={{
            width: 0, height: 0,
            borderLeft: '5px solid transparent',
            borderRight: '5px solid transparent',
            borderBottom: '5px solid var(--ink)',
          }}
        />

        {/* Header */}
        <div
          className="px-4 pt-3.5 pb-2.5 text-[11px] font-semibold tracking-wide uppercase"
          style={{ color: 'rgba(255,255,255,0.35)', borderBottom: '1px solid rgba(255,255,255,0.07)' }}
        >
          3 种输出格式的用法
        </div>

        {/* Format items */}
        <div className="px-4 py-3.5 space-y-4 text-[11px]">
          {([
            {
              label: 'CSS',
              role: '前端设计变量',
              detail: '下载 → @import 到 globals.css，全团队共享 token，进版本控制',
              detail2: '复制 → 粘进 Devtools 或 <style> 临时验证效果',
            },
            {
              label: 'Skill',
              role: 'AI 编程上下文',
              detail: '复制 → 粘进任意 AI 对话框或 system prompt，让 AI 理解项目设计规范',
              detail2: '下载 → 存入仓库，Cursor / Claude Code 等工具启动时自动加载',
            },
            {
              label: 'DESIGN.md',
              role: '设计规范源文件',
              detail: '下载 → 项目根目录存档，CSS / Skill 都从它派生',
              detail2: '复制 → 直接粘给 AI 提供一次性完整设计上下文',
            },
          ] as const).map(({ label, role, detail, detail2 }) => (
            <div key={label}>
              <div className="flex items-center gap-1.5 mb-1.5">
                <span
                  className="px-1.5 py-px rounded text-[10px] font-mono font-semibold"
                  style={{ backgroundColor: 'rgba(255,255,255,0.10)', color: 'rgba(255,255,255,0.75)' }}
                >
                  {label}
                </span>
                <span style={{ color: 'rgba(255,255,255,0.3)' }}>·</span>
                <span style={{ color: 'rgba(255,255,255,0.45)' }}>{role}</span>
              </div>
              <div className="space-y-0.5 leading-relaxed" style={{ color: 'rgba(255,255,255,0.38)' }}>
                <div>{detail}</div>
                <div>{detail2}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div
          className="px-4 pb-3.5 text-[10px] flex items-center gap-2"
          style={{ color: 'rgba(255,255,255,0.2)', borderTop: '1px solid rgba(255,255,255,0.07)', paddingTop: '10px' }}
        >
          <span>⬇ 下载 = 持久化到项目</span>
          <span>·</span>
          <span>📋 复制 = 即时粘贴给 AI</span>
        </div>
      </div>
    </div>
  )
}

// ── Reusable export pill: [⬇ label | 📋] ──────────────────────────────────
function ExportGroup({
  label, onDownload, onCopy, copied, downloadTitle, copyTitle,
}: {
  label: string
  onDownload: () => void
  onCopy: () => void
  copied: boolean
  downloadTitle: string
  copyTitle: string
}) {
  return (
    // No overflow:hidden so the tooltip can escape upward;
    // border-radius is applied per-button instead.
    <div className="flex items-center" style={{ border: '1px solid var(--hairline)', borderRadius: '8px' }}>
      {/* Primary: download with label */}
      <button
        onClick={onDownload}
        className="flex items-center gap-1.5 text-xs font-medium px-2.5 py-1.5 transition-opacity hover:opacity-70"
        style={{
          backgroundColor: 'var(--surface-card)',
          color: 'var(--body)',
          borderRight: '1px solid var(--hairline)',
          borderRadius: '8px 0 0 8px',
        }}
        title={downloadTitle}
      >
        <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M8 2v8M5 7l3 3 3-3" />
          <path d="M3 13h10" />
        </svg>
        {label}
      </button>

      {/* Secondary: copy icon with tooltip */}
      <div className="relative group/copy self-stretch flex items-center">
        <button
          onClick={onCopy}
          className="flex items-center justify-center h-full px-2.5 transition-opacity hover:opacity-70"
          style={{
            backgroundColor: 'var(--surface-card)',
            color: copied ? 'var(--brand-mint)' : 'var(--body)',
            borderRadius: '0 8px 8px 0',
          }}
        >
          {copied ? (
            <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 8l4 4 6-6" />
            </svg>
          ) : (
            <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="5" y="5" width="9" height="9" rx="1.5" />
              <path d="M11 5V3.5A1.5 1.5 0 0 0 9.5 2h-6A1.5 1.5 0 0 0 2 3.5v6A1.5 1.5 0 0 0 3.5 11H5" />
            </svg>
          )}
        </button>
        {/* Tooltip — appears below the header bar */}
        <div
          className="absolute top-full left-1/2 -translate-x-1/2 mt-2 px-2 py-1 rounded-md whitespace-nowrap pointer-events-none z-50 opacity-0 group-hover/copy:opacity-100 transition-opacity duration-150"
          style={{ backgroundColor: 'var(--ink)', color: '#fff', fontSize: '11px', lineHeight: '1.4' }}
        >
          {/* Arrow pointing up */}
          <span
            className="absolute bottom-full left-1/2 -translate-x-1/2"
            style={{ width: 0, height: 0, borderLeft: '4px solid transparent', borderRight: '4px solid transparent', borderBottom: `4px solid var(--ink)` }}
          />
          {copyTitle}
        </div>
      </div>
    </div>
  )
}

export default function EditorPage() {
  const { lang, setLang, t } = useLanguage()
  const [content, setContent] = useState('')
  const [highlightLine, setHighlightLine] = useState<number | undefined>()
  const [copiedFormat, setCopiedFormat] = useState<'css' | 'skill' | 'md' | null>(null)
  const [saveState, setSaveState] = useState<'saved' | 'saving'>('saved')
  const [translating, setTranslating] = useState(false)
  const editorRef = useRef<CodeEditorHandle>(null)
  const aiPanelRef = useRef<ImperativePanelHandle>(null)
  const [aiCollapsed, setAiCollapsed] = useState(false)

  // Load from localStorage on mount
  useEffect(() => {
    const saved = loadDesignMD()
    if (saved) setContent(saved)
    // If nothing saved, leave content empty → GettingStarted will show
  }, [])

  // Auto-save with debounce
  const debouncedContent = useDebounce(content, 1000)
  useEffect(() => {
    if (!debouncedContent) return
    setSaveState('saving')
    saveDesignMD(debouncedContent)
    setSaveState('saved')
  }, [debouncedContent])

  // Parse AST with debounce for preview
  const debouncedForParse = useDebounce(content, DEBOUNCE_MS)
  const ast = useMemo(() => {
    if (!debouncedForParse) return null
    try { return parseDESIGNMD(debouncedForParse) } catch { return null }
  }, [debouncedForParse])

  const handleTokenClick = useCallback((line: number) => {
    setHighlightLine(line)
    editorRef.current?.scrollToLine(line)
  }, [])

  // Debounce preview scroll so rapid cursor movement doesn't cause jitter
  const debouncedHighlightLine = useDebounce(highlightLine, 120)

  const handleCursorChange = useCallback((line: number) => {
    setHighlightLine(line)
  }, [])

  const handleTranslate = useCallback(async (targetLang: 'en' | 'zh') => {
    if (!content.trim() || translating) return
    setTranslating(true)
    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode: 'translate', description: targetLang, currentContent: content }),
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const reader = res.body!.getReader()
      const decoder = new TextDecoder()
      let full = ''
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        full += decoder.decode(value, { stream: true })
      }
      if (full.trim() && !full.includes('__ERROR')) setContent(full)
    } catch {
      // silently ignore, keep original content
    } finally {
      setTranslating(false)
    }
  }, [content, translating])

  const handleInsertTemplate = useCallback((snippet: string) => {
    setContent(prev => {
      const trimmed = prev.trimEnd()
      return trimmed ? trimmed + '\n\n' + snippet : snippet
    })
  }, [])

  const handleTokenColorChange = useCallback((line: number, newColor: string) => {
    setContent(prev => {
      const lines = prev.split('\n')
      const idx = line - 1
      if (idx < 0 || idx >= lines.length) return prev
      lines[idx] = lines[idx].replace(/#[0-9A-Fa-f]{3,8}/i, newColor)
      return lines.join('\n')
    })
  }, [])

  const handleDownload = () => {
    const filename = (ast?.meta.project ?? 'design').toLowerCase().replace(/\s+/g, '-') + '.design.md'
    const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleExportSkill = () => {
    if (!ast) return
    const skillMd = exportToSkill(ast)
    const filename = (ast.meta.project ?? 'design').toLowerCase().replace(/\s+/g, '-') + '.skill.md'
    const blob = new Blob([skillMd], { type: 'text/markdown;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleExportCSS = () => {
    if (!ast) return
    const css = exportToCSS(ast)
    const filename = (ast.meta.project ?? 'design').toLowerCase().replace(/\s+/g, '-') + '.tokens.css'
    const blob = new Blob([css], { type: 'text/css;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    a.click()
    URL.revokeObjectURL(url)
  }

  const flash = (fmt: typeof copiedFormat, ms = 2500) => {
    setCopiedFormat(fmt)
    setTimeout(() => setCopiedFormat(null), ms)
  }

  const handleCopyMD = async () => {
    if (!content) return
    await copyText(content)
    flash('md')
  }

  const handleCopyCSS = async () => {
    if (!ast) return
    await copyText(exportToCSS(ast))
    flash('css')
  }

  const handleCopySkill = async () => {
    if (!ast) return
    await copyText(exportToSkill(ast))
    flash('skill')
  }

  return (
    <div className="h-screen flex flex-col bg-neutral-50">
      {/* Topbar */}
      <header className="h-14 flex items-center gap-3 px-5 shrink-0"
        style={{ backgroundColor: 'var(--canvas)', borderBottom: '1px solid var(--hairline)' }}>
        <a href="/" className="text-sm font-semibold tracking-tight transition-opacity hover:opacity-60"
          style={{ color: 'var(--ink)' }}>
          TasteDNA
        </a>
        <span style={{ color: 'var(--hairline)' }}>|</span>
        <span className="text-sm font-medium" style={{ color: 'var(--muted)' }}>
          {ast?.meta.project ?? t('editorTitle')}
        </span>

        {/* Insert template */}
        <TemplateMenu onInsert={handleInsertTemplate} />

        <div className="flex-1" />

        {/* Save state */}
        <span className="text-xs" style={{ color: 'var(--muted-soft)' }}>
          {saveState === 'saving' ? t('saving') : t('saved')}
        </span>

        {/* ── Export groups + help ── */}
        <div className="flex items-center gap-2">
          {/* CSS */}
          {ast && <ExportGroup
            label="CSS"
            onDownload={handleExportCSS}
            onCopy={handleCopyCSS}
            copied={copiedFormat === 'css'}
            downloadTitle="下载 CSS 变量文件（tokens.css）"
            copyTitle="复制 CSS 变量"
          />}

          {/* Skill */}
          {ast && <ExportGroup
            label="Skill"
            onDownload={handleExportSkill}
            onCopy={handleCopySkill}
            copied={copiedFormat === 'skill'}
            downloadTitle="下载 AI Skill 文件（.skill.md）"
            copyTitle="复制 Skill 内容"
          />}

          {/* DESIGN.md */}
          <ExportGroup
            label="DESIGN.md"
            onDownload={handleDownload}
            onCopy={handleCopyMD}
            copied={copiedFormat === 'md'}
            downloadTitle="下载 DESIGN.md 文件"
            copyTitle="复制 DESIGN.md 内容"
          />

          {/* Format usage guide */}
          <FormatHelp />
        </div>

        {/* Language switch — segmented control */}
        <div
          className="flex items-center text-xs font-medium font-mono"
          style={{
            backgroundColor: 'var(--surface-card)',
            border: '1px solid var(--hairline)',
            borderRadius: '8px',
            padding: '2px',
            gap: '1px',
            opacity: translating ? 0.45 : 1,
            transition: 'opacity 0.15s',
          }}
          title={translating ? '翻译中…' : lang === 'zh' ? '切换为英文并翻译内容' : 'Switch to Chinese and translate'}
        >
          {(['zh', 'en'] as const).map((l) => (
            <button
              key={l}
              onClick={async () => {
                if (l === lang || translating) return
                setLang(l)
                if (content.trim()) await handleTranslate(l)
              }}
              disabled={translating}
              className="px-2.5 py-1 transition-all disabled:cursor-not-allowed"
              style={{
                borderRadius: '6px',
                backgroundColor: lang === l
                  ? translating ? 'var(--muted-soft)' : 'var(--ink)'
                  : 'transparent',
                color: lang === l ? '#fff' : 'var(--muted)',
                lineHeight: 1,
              }}
            >
              {l === 'zh' ? '中' : 'EN'}
            </button>
          ))}
        </div>
      </header>

      {/* Main content */}
      <div className="flex-1 min-h-0">
        <EditorLayout
          left={
            <PanelGroup direction="vertical" className="h-full">
              <Panel defaultSize={58} minSize={20}>
                <CodeEditor
                  ref={editorRef}
                  value={content}
                  onChange={setContent}
                  highlightLine={highlightLine}
                  onCursorChange={handleCursorChange}
                />
              </Panel>
              <PanelResizeHandle className="h-1 bg-neutral-600 hover:bg-violet-400 transition-colors cursor-row-resize relative group">
                <div className="absolute inset-x-0 -top-1 -bottom-1 group-hover:bg-violet-400/20" />
              </PanelResizeHandle>
              <Panel
                ref={aiPanelRef}
                defaultSize={42}
                minSize={20}
                maxSize={75}
                collapsible
                collapsedSize={4}
                onCollapse={() => setAiCollapsed(true)}
                onExpand={() => setAiCollapsed(false)}
              >
                <AIChatPanel
                  currentContent={content}
                  onApply={setContent}
                  collapsed={aiCollapsed}
                  onToggleCollapse={() => {
                    if (aiCollapsed) aiPanelRef.current?.expand()
                    else aiPanelRef.current?.collapse()
                  }}
                  onWizardOpen={() => {
                    const HEADER_H = 48
                    const target = Math.min(
                      600 / (window.innerHeight - HEADER_H) * 100,
                      75
                    )
                    aiPanelRef.current?.resize(target)
                  }}
                />
              </Panel>
            </PanelGroup>
          }
          right={
            <div className="h-full overflow-hidden">
              {ast ? (
                <PreviewPanel
                  ast={ast}
                  onTokenClick={handleTokenClick}
                  onTokenColorChange={handleTokenColorChange}
                  highlightedLine={debouncedHighlightLine}
                />
              ) : (
                <GettingStarted onLoadStarter={setContent} />
              )}
            </div>
          }
        />
      </div>


    </div>
  )
}
