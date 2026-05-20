'use client'

import { useState, useRef, useEffect } from 'react'

interface Props {
  onGenerated: (content: string) => void
  onClose: () => void
}

const EXAMPLES = [
  '蓝色调 SaaS 产品，干净现代风，偏商务',
  '暖橙色调餐饮 App，活泼有食欲感',
  '深色系游戏平台，科技感十足',
  '绿色健康医疗应用，专业可信赖',
  '极简黑白设计工具，专注内容',
]

export default function AIGenerateDialog({ onGenerated, onClose }: Props) {
  const [input, setInput] = useState('')
  const [status, setStatus] = useState<'idle' | 'generating' | 'done'>('idle')
  const [preview, setPreview] = useState('')
  const [error, setError] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const abortRef = useRef<AbortController | null>(null)

  useEffect(() => {
    textareaRef.current?.focus()
    const handleKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [onClose])

  const handleGenerate = async () => {
    if (!input.trim() || status === 'generating') return
    setStatus('generating')
    setPreview('')
    setError('')
    abortRef.current = new AbortController()

    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ description: input }),
        signal: abortRef.current.signal,
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)

      const reader = res.body!.getReader()
      const decoder = new TextDecoder()
      let full = ''
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        const chunk = decoder.decode(value, { stream: true })
        full += chunk
        setPreview(full)
      }
      setStatus('done')
      onGenerated(full)
    } catch (e: unknown) {
      if ((e as Error).name === 'AbortError') {
        setStatus('idle')
      } else {
        setError((e as Error).message ?? '生成失败，请重试')
        setStatus('idle')
      }
    }
  }

  const handleCancel = () => {
    abortRef.current?.abort()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
      onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl mx-4 overflow-hidden">
        {/* Header */}
        <div className="px-6 pt-6 pb-4 border-b border-neutral-100">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold text-neutral-900">✦ AI 生成设计规范</h2>
              <p className="text-xs text-neutral-400 mt-0.5">描述你的产品风格，自动生成完整 DESIGN.md</p>
            </div>
            <button onClick={onClose} className="text-neutral-400 hover:text-neutral-600 text-lg leading-none">✕</button>
          </div>
        </div>

        {/* Input area */}
        <div className="px-6 py-4">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleGenerate() }}
            placeholder="例：蓝色调 SaaS 产品，干净现代风，偏商务感…"
            className="w-full h-24 text-sm text-neutral-800 placeholder-neutral-400 border border-neutral-200 rounded-xl px-4 py-3 resize-none focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
            disabled={status === 'generating'}
          />

          {/* Examples */}
          <div className="flex flex-wrap gap-1.5 mt-2">
            {EXAMPLES.map(ex => (
              <button
                key={ex}
                onClick={() => setInput(ex)}
                disabled={status === 'generating'}
                className="text-[11px] px-2.5 py-1 rounded-full bg-neutral-100 hover:bg-indigo-50 hover:text-indigo-600 text-neutral-500 transition-colors"
              >
                {ex}
              </button>
            ))}
          </div>

          {error && (
            <p className="mt-2 text-xs text-red-500">{error}</p>
          )}
        </div>

        {/* Streaming preview */}
        {(status === 'generating' || status === 'done') && (
          <div className="mx-6 mb-4 rounded-xl bg-neutral-950 overflow-hidden">
            <div className="flex items-center justify-between px-3 py-2 border-b border-white/10">
              <span className="text-[11px] text-neutral-400 font-mono">DESIGN.md</span>
              {status === 'generating' && (
                <span className="text-[11px] text-indigo-400 animate-pulse">生成中…</span>
              )}
              {status === 'done' && (
                <span className="text-[11px] text-emerald-400">✓ 生成完成</span>
              )}
            </div>
            <pre className="px-3 py-3 text-[11px] font-mono text-neutral-300 leading-relaxed max-h-48 overflow-y-auto">
              {preview || ' '}
            </pre>
          </div>
        )}

        {/* Footer */}
        <div className="px-6 pb-5 flex items-center justify-between">
          <p className="text-[11px] text-neutral-400">⌘↩ 快速生成</p>
          <div className="flex gap-2">
            {status === 'generating' ? (
              <button
                onClick={handleCancel}
                className="px-4 py-2 text-xs rounded-lg bg-neutral-100 hover:bg-neutral-200 text-neutral-600 transition-colors"
              >
                停止
              </button>
            ) : (
              <>
                <button
                  onClick={onClose}
                  className="px-4 py-2 text-xs rounded-lg bg-neutral-100 hover:bg-neutral-200 text-neutral-600 transition-colors"
                >
                  取消
                </button>
                <button
                  onClick={handleGenerate}
                  disabled={!input.trim()}
                  className="px-4 py-2 text-xs rounded-lg font-medium text-white transition-colors disabled:opacity-40"
                  style={{ backgroundColor: '#4F6EF7' }}
                  onMouseOver={e => { if (input.trim()) (e.currentTarget.style.backgroundColor = '#3451D1') }}
                  onMouseOut={e => (e.currentTarget.style.backgroundColor = '#4F6EF7')}
                >
                  {status === 'done' ? '已载入编辑器 ✓' : '生成'}
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
