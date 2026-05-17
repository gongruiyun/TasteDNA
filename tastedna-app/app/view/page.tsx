'use client'

import { useState, useEffect, useMemo } from 'react'
import { useSearchParams } from 'next/navigation'
import { Suspense } from 'react'
import { parseDESIGNMD } from '@/lib/parser'
import PreviewPanel from '@/components/preview/PreviewPanel'
import { decompressFromBase64 } from '@/lib/utils/share'
import { copyText } from '@/lib/utils/clipboard'

function ViewContent() {
  const searchParams = useSearchParams()
  const [content, setContent] = useState<string | null>(null)
  const [error, setError] = useState(false)

  useEffect(() => {
    const d = searchParams.get('d')
    if (!d) { setError(true); return }
    decompressFromBase64(d).then(setContent).catch(() => setError(true))
  }, [searchParams])

  const ast = useMemo(() => {
    if (!content) return null
    try { return parseDESIGNMD(content) } catch { return null }
  }, [content])

  const handleFork = () => {
    if (!content) return
    localStorage.setItem('tastedna:design-md', content)
    window.location.href = '/editor'
  }

  const handleCopyPrompt = async () => {
    if (!ast) return
    const aiSection = ast.sections.find(s => s.id === 'ai-context')
    const prompt = aiSection?.subsections.find(s => s.id === 'full-prompt')?.rawText ?? ''
    if (prompt) await copyText(prompt)
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-screen gap-4 text-neutral-500">
        <p className="text-lg font-medium">链接无效或已过期</p>
        <a href="/editor" className="text-indigo-500 hover:underline text-sm">返回编辑器</a>
      </div>
    )
  }

  if (!ast) {
    return (
      <div className="flex items-center justify-center h-screen text-neutral-400 text-sm">
        加载中…
      </div>
    )
  }

  return (
    <div className="h-screen flex flex-col bg-white">
      {/* Topbar */}
      <header className="h-14 flex items-center gap-4 px-6 border-b border-neutral-200 shrink-0">
        <a href="/" className="text-base font-bold text-neutral-900 hover:text-indigo-600 transition-colors">
          TasteDNA
        </a>
        <span className="text-neutral-300">|</span>
        <span className="text-sm text-neutral-600">{ast.meta.project ?? '设计规范'}</span>
        <div className="flex-1" />
        <button
          onClick={handleCopyPrompt}
          className="text-xs font-medium px-3 py-1.5 rounded-lg bg-neutral-100 hover:bg-neutral-200 text-neutral-600 transition-colors"
        >
          复制 AI Prompt
        </button>
        <button
          onClick={handleFork}
          className="text-xs font-medium px-3 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-600 transition-colors"
        >
          Fork 到我的编辑器
        </button>
      </header>

      {/* Preview */}
      <div className="flex-1 min-h-0">
        <PreviewPanel ast={ast} />
      </div>
    </div>
  )
}

export default function ViewPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center h-screen text-neutral-400 text-sm">加载中…</div>
    }>
      <ViewContent />
    </Suspense>
  )
}
