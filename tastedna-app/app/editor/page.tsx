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
      <header className="h-14 flex items-center gap-4 px-4 bg-white border-b border-neutral-200 shrink-0">
        <a href="/" className="text-base font-bold text-neutral-900 hover:text-indigo-600 transition-colors">
          TasteDNA
        </a>
        <span className="text-neutral-300">|</span>
        <span className="text-sm text-neutral-600 font-medium">
          {ast?.meta.project ?? t('editorTitle')}
        </span>

        {/* Insert template */}
        <TemplateMenu onInsert={handleInsertTemplate} />

        <div className="flex-1" />

        {/* Save state */}
        <span className="text-xs text-neutral-400">
          {saveState === 'saving' ? t('saving') : t('saved')}
        </span>

        {/* Copy Markdown */}
        <button
          onClick={handleCopyPrompt}
          className="text-xs font-medium px-3 py-1.5 rounded-lg bg-neutral-100 hover:bg-neutral-200 text-neutral-600 transition-colors"
        >
          {copied ? '✓ 已复制' : '复制 DESIGN.md'}
        </button>

        {/* Download */}
        <button
          onClick={handleDownload}
          className="text-xs font-medium px-3 py-1.5 rounded-lg bg-neutral-100 hover:bg-neutral-200 text-neutral-600 transition-colors"
        >
          {t('download')}
        </button>

        {/* Share */}
        <button
          onClick={handleShare}
          className="text-xs font-medium px-3 py-1.5 rounded-lg transition-colors"
          style={{
            backgroundColor: copied ? '#34C97B22' : '#4F6EF715',
            color: copied ? '#34C97B' : '#4F6EF7',
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
          className="text-xs font-medium px-2.5 py-1.5 rounded-lg bg-neutral-100 hover:bg-neutral-200 text-neutral-500 transition-colors font-mono disabled:opacity-50 disabled:cursor-not-allowed min-w-[2.5rem] text-center"
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
              <PanelResizeHandle className="h-1 bg-neutral-600 hover:bg-indigo-400 transition-colors cursor-row-resize relative group">
                <div className="absolute inset-x-0 -top-1 -bottom-1 group-hover:bg-indigo-400/20" />
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
