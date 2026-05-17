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
  const [content, setContent] = useState('')
  const [highlightLine, setHighlightLine] = useState<number | undefined>()
  const [shareUrl, setShareUrl] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [saveState, setSaveState] = useState<'saved' | 'saving'>('saved')
  const editorRef = useRef<CodeEditorHandle>(null)

  // Load from localStorage on mount
  useEffect(() => {
    const saved = loadDesignMD()
    if (saved) {
      setContent(saved)
    } else {
      // Load sample
      fetch('/sample.design.md').then(r => r.text()).then(setContent).catch(() => {})
    }
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

  const handleShare = async () => {
    const url = await buildShareUrl(content)
    setShareUrl(url)
    await copyText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 3000)
  }

  const handleCopyPrompt = async () => {
    if (!ast) return
    const aiSection = ast.sections.find(s => s.id === 'ai-context')
    const promptSub = aiSection?.subsections.find(s => s.id === 'full-prompt')
    const prompt = promptSub?.rawText ?? ''
    if (prompt) {
      await copyText(prompt)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
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
          {ast?.meta.project ?? '设计规范编辑器'}
        </span>

        <div className="flex-1" />

        {/* Save state */}
        <span className="text-xs text-neutral-400">
          {saveState === 'saving' ? '保存中…' : '已自动保存'}
        </span>

        {/* Copy AI Prompt */}
        <button
          onClick={handleCopyPrompt}
          className="text-xs font-medium px-3 py-1.5 rounded-lg bg-neutral-100 hover:bg-neutral-200 text-neutral-600 transition-colors"
        >
          复制 AI Prompt
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
          {copied ? '✓ 链接已复制' : '分享'}
        </button>
      </header>

      {/* Main content */}
      <div className="flex-1 min-h-0">
        <EditorLayout
          left={
            <CodeEditor
              ref={editorRef}
              value={content}
              onChange={setContent}
              highlightLine={highlightLine}
            />
          }
          right={
            ast ? (
              <PreviewPanel
                ast={ast}
                onTokenClick={handleTokenClick}
                highlightedLine={highlightLine}
              />
            ) : (
              <div className="flex items-center justify-center h-full text-neutral-400 text-sm">
                在左侧输入 DESIGN.md 内容…
              </div>
            )
          }
        />
      </div>
    </div>
  )
}
