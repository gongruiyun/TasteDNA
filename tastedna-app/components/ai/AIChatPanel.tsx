'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { flushSync } from 'react-dom'

type InputTab = 'text' | 'image' | 'url'

interface ImageItem {
  base64: string
  mime: string
  preview: string
}

interface Message {
  role: 'user' | 'assistant'
  content: string
  inputType?: InputTab
  imagePreviews?: string[]
  urlInfo?: { title: string; url: string }
}

interface Props {
  currentContent: string
  onApply: (content: string) => void
  collapsed?: boolean
  onToggleCollapse?: () => void
}

function readFileAsImage(file: File): Promise<ImageItem> {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) { reject(new Error('不是图片')); return }
    const reader = new FileReader()
    reader.onload = (e) => {
      const result = e.target?.result as string
      resolve({ base64: result.split(',')[1], mime: file.type, preview: result })
    }
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

export default function AIChatPanel({ currentContent, onApply, collapsed, onToggleCollapse }: Props) {
  const [tab, setTab] = useState<InputTab>('text')
  const [input, setInput] = useState('')
  const [urlInput, setUrlInput] = useState('')
  const [images, setImages] = useState<ImageItem[]>([])
  const [isDragging, setIsDragging] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [generating, setGenerating] = useState(false)
  const [urlLoading, setUrlLoading] = useState(false)
  const [urlData, setUrlData] = useState<Record<string, unknown> | null>(null)

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const dropZoneRef = useRef<HTMLDivElement>(null)
  const abortRef = useRef<AbortController | null>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, generating])

  // Global paste listener
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      if (tab !== 'image') return
      const items = Array.from(e.clipboardData?.items ?? [])
      const imageItems = items.filter(i => i.type.startsWith('image/'))
      if (!imageItems.length) return
      e.preventDefault()
      Promise.all(imageItems.map(item => {
        const file = item.getAsFile()
        return file ? readFileAsImage(file) : null
      })).then(results => {
        const valid = results.filter(Boolean) as ImageItem[]
        setImages(prev => [...prev, ...valid].slice(0, 8))
      })
    }
    document.addEventListener('paste', handlePaste)
    return () => document.removeEventListener('paste', handlePaste)
  }, [tab])

  const addFiles = useCallback(async (files: FileList | File[]) => {
    const arr = Array.from(files).filter(f => f.type.startsWith('image/')).slice(0, 8)
    const results = await Promise.all(arr.map(readFileAsImage))
    setImages(prev => [...prev, ...results].slice(0, 8))
  }, [])

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.length) addFiles(e.target.files)
    e.target.value = ''
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    if (e.dataTransfer.files.length) addFiles(e.dataTransfer.files)
  }

  const removeImage = (idx: number) => setImages(prev => prev.filter((_, i) => i !== idx))

  const handleFetchUrl = async () => {
    if (!urlInput.trim()) return
    setUrlLoading(true)
    setUrlData(null)
    try {
      const res = await fetch('/api/analyze-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: urlInput.trim() }),
      })
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      setUrlData(data)
    } catch (e: unknown) {
      setUrlData({ error: (e as Error).message })
    } finally {
      setUrlLoading(false)
    }
  }

  const handleSend = useCallback(async () => {
    const hasInput =
      tab === 'text' ? input.trim() :
      tab === 'image' ? images.length > 0 :
      urlData && !urlData.error
    if (!hasInput || generating) return

    const isRefinement = messages.length > 0 && !!currentContent

    const userMsg: Message = {
      role: 'user',
      content: input || (tab === 'image' ? `请分析这${images.length > 1 ? `${images.length}张` : ''}图片的设计风格` : `分析网站：${urlInput}`),
      inputType: tab,
      imagePreviews: tab === 'image' ? images.map(i => i.preview) : undefined,
      urlInfo: tab === 'url' && urlData ? { title: (urlData.title as string) || urlInput, url: urlInput } : undefined,
    }
    setMessages(prev => [...prev, userMsg])
    setInput('')
    setGenerating(true)

    abortRef.current = new AbortController()

    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: isRefinement ? 'refine' : tab === 'image' ? 'image' : tab === 'url' ? 'url' : 'generate',
          description: input || undefined,
          images: tab === 'image' ? images.map(i => ({ base64: i.base64, mime: i.mime })) : undefined,
          urlData: tab === 'url' ? urlData : undefined,
          currentContent: isRefinement ? currentContent : undefined,
          history: messages.slice(-6).map(m => ({ role: m.role, content: m.content })),
        }),
        signal: abortRef.current.signal,
      })

      if (!res.ok) throw new Error(`HTTP ${res.status}`)

      const reader = res.body!.getReader()
      const decoder = new TextDecoder()
      let full = ''

      setMessages(prev => [...prev, { role: 'assistant', content: '' }])

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        full += decoder.decode(value, { stream: true })
        flushSync(() => {
          setMessages(prev => {
            const updated = [...prev]
            updated[updated.length - 1] = { role: 'assistant', content: full }
            return updated
          })
        })
      }

      if (full.includes('__ERROR_401__')) {
        flushSync(() => {
          setMessages(prev => {
            const updated = [...prev]
            updated[updated.length - 1] = {
              role: 'assistant',
              content: '⚠️ API Key 无效或已过期。\n\n请在项目根目录的 `.env.local` 文件中更新 `ANTHROPIC_API_KEY`，需要以 `sk-ant-api03-` 开头的正式 API Key（可在 console.anthropic.com 获取），然后重启开发服务器。',
            }
            return updated
          })
        })
      }

      setGenerating(false)
      if (tab === 'image') setImages([])
    } catch (e: unknown) {
      if ((e as Error).name !== 'AbortError') {
        setMessages(prev => [...prev, { role: 'assistant', content: '⚠️ 生成失败，请重试。' }])
      }
      setGenerating(false)
    }
  }, [tab, input, images, urlInput, urlData, messages, generating, currentContent])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleSend()
  }

  const canSend = !generating && (
    (tab === 'text' && !!input.trim()) ||
    (tab === 'image' && images.length > 0) ||
    (tab === 'url' && !!urlData && !urlData.error)
  )

  return (
    <div className="flex flex-col h-full bg-white border-t border-neutral-200">
      {/* Header */}
      <div
        className="flex items-center justify-between px-4 py-2 border-b border-neutral-100 shrink-0 cursor-pointer select-none"
        onClick={onToggleCollapse}
      >
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-indigo-500">✦ AI 助手</span>
          {!collapsed && messages.length > 0 && (
            <span className="text-[10px] text-neutral-400">
              {messages.filter(m => m.role === 'assistant').length} 次对话
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {!collapsed && messages.length > 0 && (
            <button
              onClick={(e) => { e.stopPropagation(); setMessages([]) }}
              className="text-[10px] text-neutral-400 hover:text-neutral-600 transition-colors"
            >
              清空
            </button>
          )}
          <svg
            className={`w-3.5 h-3.5 text-neutral-400 transition-transform ${collapsed ? 'rotate-180' : ''}`}
            fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3 min-h-0">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full gap-3 text-center py-6">
            <div className="text-2xl">✦</div>
            <p className="text-xs font-medium text-neutral-500">描述风格、上传截图或输入网址</p>
            <p className="text-[11px] text-neutral-400">生成后可继续对话持续优化</p>
            <div className="flex flex-wrap justify-center gap-1.5 mt-1">
              {['蓝色调 SaaS，干净现代', '暖橙色餐饮 App', '深色科技游戏平台', '极简黑白设计工具'].map(ex => (
                <button key={ex} onClick={() => { setTab('text'); setInput(ex) }}
                  className="text-[10px] px-2.5 py-1 rounded-full bg-neutral-100 hover:bg-indigo-50 hover:text-indigo-600 text-neutral-500 transition-colors">
                  {ex}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg, i) => (
          <div key={i} className={`flex flex-col gap-1 ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
            {msg.imagePreviews && (
              <div className="flex gap-1 flex-wrap justify-end">
                {msg.imagePreviews.map((src, j) => (
                  <img key={j} src={src} alt="" className="max-h-20 max-w-[120px] rounded-lg border border-neutral-200 object-cover" />
                ))}
              </div>
            )}
            {msg.urlInfo && (
              <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-neutral-100 text-[11px] text-neutral-600 max-w-[220px]">
                <span>🔗</span><span className="truncate">{msg.urlInfo.title || msg.urlInfo.url}</span>
              </div>
            )}
            <div className={`rounded-xl px-3 py-2 text-[12px] leading-relaxed max-w-[85%] ${
              msg.role === 'user' ? 'bg-indigo-500 text-white' : 'bg-neutral-100 text-neutral-700'
            }`}>
              {msg.role === 'assistant' ? (
                <div>
                  <pre className="whitespace-pre-wrap font-mono text-[10px] leading-relaxed max-h-32 overflow-y-auto">
                    {msg.content
                      ? msg.content.slice(0, 400) + (msg.content.length > 400 ? '\n…' : '')
                      : <span className="animate-pulse text-neutral-400">生成中…</span>}
                  </pre>
                  {msg.content && !generating && (
                    <div className="mt-2 flex gap-1.5">
                      <button
                        onClick={() => onApply(msg.content)}
                        className="flex-1 text-center text-[11px] font-medium py-1.5 rounded-lg bg-indigo-500 text-white hover:bg-indigo-600 transition-colors"
                        title="替换编辑器中的全部内容"
                      >
                        覆盖
                      </button>
                      <button
                        onClick={() => {
                          const sep = currentContent.trimEnd() ? '\n\n' : ''
                          onApply(currentContent.trimEnd() + sep + msg.content)
                        }}
                        className="flex-1 text-center text-[11px] font-medium py-1.5 rounded-lg bg-neutral-100 text-neutral-600 hover:bg-neutral-200 transition-colors"
                        title="追加到编辑器现有内容末尾"
                      >
                        追加
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <span>{msg.content}</span>
              )}
            </div>
          </div>
        ))}

        {generating && messages[messages.length - 1]?.role !== 'assistant' && (
          <div className="flex items-start">
            <div className="rounded-xl px-3 py-2 bg-neutral-100 text-[11px] text-neutral-400 animate-pulse">生成中…</div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input area */}
      <div className="shrink-0 border-t border-neutral-100 px-3 pt-2 pb-3">
        {/* Tabs */}
        <div className="flex gap-1 mb-2">
          {(['text', 'image', 'url'] as InputTab[]).map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`text-[11px] px-2.5 py-1 rounded-md transition-colors font-medium ${
                tab === t ? 'bg-indigo-500 text-white' : 'bg-neutral-100 text-neutral-500 hover:bg-neutral-200'
              }`}>
              {t === 'text' ? '📝 文字' : t === 'image' ? '🖼️ 图片' : '🔗 网址'}
            </button>
          ))}
          {messages.length > 0 && (
            <span className="ml-auto text-[10px] text-neutral-400 self-center">可继续对话优化</span>
          )}
        </div>

        {/* Text */}
        {tab === 'text' && (
          <div className="flex gap-2">
            <textarea value={input} onChange={e => setInput(e.target.value)} onKeyDown={handleKeyDown}
              placeholder={messages.length > 0 ? '继续优化，例如：主色改暖一点…' : '描述你的产品风格…'}
              className="flex-1 text-xs text-neutral-800 placeholder-neutral-400 border border-neutral-200 rounded-lg px-3 py-2 resize-none focus:outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-100 h-16"
              disabled={generating} />
            <button onClick={handleSend} disabled={!canSend}
              className="px-3 rounded-lg text-xs font-medium text-white self-end h-8 disabled:opacity-40 transition-colors"
              style={{ backgroundColor: '#4F6EF7' }}>
              {generating ? '…' : '发送'}
            </button>
          </div>
        )}

        {/* Image */}
        {tab === 'image' && (
          <div className="space-y-2">
            {/* Drop zone */}
            <div
              ref={dropZoneRef}
              onClick={() => fileInputRef.current?.click()}
              onDragOver={e => { e.preventDefault(); setIsDragging(true) }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              className={`border-2 border-dashed rounded-lg p-3 text-center cursor-pointer transition-colors ${
                isDragging ? 'border-indigo-400 bg-indigo-50' : 'border-neutral-200 hover:border-indigo-300'
              }`}
            >
              {images.length > 0 ? (
                <div className="flex gap-2 flex-wrap justify-center" onClick={e => e.stopPropagation()}>
                  {images.map((img, i) => (
                    <div key={i} className="relative group">
                      <img src={img.preview} alt="" className="h-16 w-16 object-cover rounded-lg border border-neutral-200" />
                      <button
                        onClick={() => removeImage(i)}
                        className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-neutral-800 text-white text-[9px] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      >✕</button>
                    </div>
                  ))}
                  {images.length < 4 && (
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="h-16 w-16 rounded-lg border-2 border-dashed border-neutral-200 hover:border-indigo-300 text-neutral-400 text-xl flex items-center justify-center transition-colors"
                    >+</button>
                  )}
                </div>
              ) : (
                <div className="py-1">
                  <p className="text-[11px] text-neutral-400">点击上传 / 拖入 / ⌘V 粘贴</p>
                  <p className="text-[10px] text-neutral-300 mt-0.5">支持多张，最多 8 张</p>
                </div>
              )}
            </div>
            <input ref={fileInputRef} type="file" accept="image/*" multiple className="hidden" onChange={handleFileInput} />
            <div className="flex gap-2">
              <input value={input} onChange={e => setInput(e.target.value)} placeholder="补充说明（可选）"
                className="flex-1 text-xs border border-neutral-200 rounded-lg px-3 py-1.5 focus:outline-none focus:border-indigo-400"
                disabled={generating} />
              <button onClick={handleSend} disabled={!canSend}
                className="px-3 rounded-lg text-xs font-medium text-white h-8 disabled:opacity-40"
                style={{ backgroundColor: '#4F6EF7' }}>
                分析
              </button>
            </div>
          </div>
        )}

        {/* URL */}
        {tab === 'url' && (
          <div className="space-y-2">
            <div className="flex gap-2">
              <input value={urlInput} onChange={e => { setUrlInput(e.target.value); setUrlData(null) }}
                onKeyDown={e => e.key === 'Enter' && handleFetchUrl()}
                placeholder="https://example.com"
                className="flex-1 text-xs border border-neutral-200 rounded-lg px-3 py-1.5 focus:outline-none focus:border-indigo-400 font-mono"
                disabled={urlLoading || generating} />
              <button onClick={handleFetchUrl} disabled={!urlInput.trim() || urlLoading}
                className="px-3 rounded-lg text-xs font-medium bg-neutral-100 hover:bg-neutral-200 text-neutral-600 h-8 disabled:opacity-40">
                {urlLoading ? '…' : '抓取'}
              </button>
            </div>
            {urlData && !urlData.error && (
              <div className="text-[10px] text-neutral-500 bg-neutral-50 rounded-lg px-3 py-2">
                ✓ 已提取 {(urlData.colors as string[])?.length ?? 0} 个色值、{(urlData.fonts as string[])?.length ?? 0} 个字体
                {urlData.title ? `（${urlData.title}）` : ''}
              </div>
            )}
            {!!urlData?.error && <p className="text-[10px] text-red-500">⚠ {String(urlData.error)}</p>}
            <div className="flex gap-2">
              <input value={input} onChange={e => setInput(e.target.value)} placeholder="补充说明（可选）"
                className="flex-1 text-xs border border-neutral-200 rounded-lg px-3 py-1.5 focus:outline-none focus:border-indigo-400"
                disabled={generating} />
              <button onClick={handleSend} disabled={!canSend}
                className="px-3 rounded-lg text-xs font-medium text-white h-8 disabled:opacity-40"
                style={{ backgroundColor: '#4F6EF7' }}>
                生成
              </button>
            </div>
          </div>
        )}

        <p className="text-[10px] text-neutral-400 mt-1.5 text-right">⌘↩ 发送</p>
      </div>
    </div>
  )
}
