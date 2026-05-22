'use client'

import { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import dynamic from 'next/dynamic'
import { parseDESIGNMD } from '@/lib/parser'
import PreviewPanel from '@/components/preview/PreviewPanel'
import EditorLayout from '@/components/layout/EditorLayout'
import { saveDesignMD, loadDesignMD } from '@/lib/utils/storage'
import { buildShareUrl } from '@/lib/utils/share'
import { copyText } from '@/lib/utils/clipboard'
import type { CodeEditorHandle } from '@/components/editor/CodeEditor'
import { useLanguage } from '@/lib/i18n'
import TemplateMenu from '@/components/editor/TemplateMenu'
import GettingStarted from '@/components/editor/GettingStarted'
import AIChatPanel from '@/components/ai/AIChatPanel'
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

export default function EditorPage() {
  const { lang, setLang, t } = useLanguage()
  const [content, setContent] = useState('')
  const [highlightLine, setHighlightLine] = useState<number | undefined>()
  const [shareUrl, setShareUrl] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
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

  const handleShare = async () => {
    const url = await buildShareUrl(content)
    setShareUrl(url)
    await copyText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 3000)
  }

  const handleCopyPrompt = async () => {
    if (!content) return
    await copyText(content)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
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

        {/* Copy Markdown */}
        <button
          onClick={handleCopyPrompt}
          className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 transition-opacity hover:opacity-70"
          style={{ backgroundColor: 'var(--surface-card)', color: 'var(--body)', borderRadius: '8px', border: '1px solid var(--hairline)' }}
        >
          <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <rect x="5" y="5" width="9" height="9" rx="1.5" />
            <path d="M11 5V3.5A1.5 1.5 0 0 0 9.5 2h-6A1.5 1.5 0 0 0 2 3.5v6A1.5 1.5 0 0 0 3.5 11H5" />
          </svg>
          {copied ? '✓ 已复制' : '复制 DESIGN.md'}
        </button>

        {/* Download */}
        <button
          onClick={handleDownload}
          className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 transition-opacity hover:opacity-70"
          style={{ backgroundColor: 'var(--surface-card)', color: 'var(--body)', borderRadius: '8px', border: '1px solid var(--hairline)' }}
        >
          <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M8 2v8M5 7l3 3 3-3" />
            <path d="M2 12h12" />
          </svg>
          {t('download')}
        </button>

        {/* Share */}
        <button
          onClick={handleShare}
          className="text-xs font-semibold px-3 py-1.5 transition-opacity hover:opacity-80"
          style={{
            backgroundColor: copied ? 'var(--brand-mint)' : 'var(--ink)',
            color: '#ffffff',
            borderRadius: '8px',
          }}
        >
          {copied ? t('copied') : t('share')}
        </button>

        {/* Language toggle + translate */}
        <button
          onClick={async () => {
            const next = lang === 'zh' ? 'en' : 'zh'
            setLang(next)
            if (content.trim()) await handleTranslate(next)
          }}
          disabled={translating}
          className="text-xs font-medium px-2.5 py-1.5 font-mono transition-opacity hover:opacity-70 disabled:opacity-40 disabled:cursor-not-allowed min-w-[2.5rem] text-center"
          style={{ backgroundColor: 'var(--surface-card)', color: 'var(--muted)', borderRadius: '8px', border: '1px solid var(--hairline)' }}
          title={lang === 'zh' ? '翻译为英文' : 'Translate to Chinese'}
        >
          {translating ? '…' : lang === 'zh' ? 'EN' : '中'}
        </button>
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
                  highlightedLine={highlightLine}
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
