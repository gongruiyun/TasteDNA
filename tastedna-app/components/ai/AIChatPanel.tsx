'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { flushSync } from 'react-dom'
import TasteGuideWizard from './TasteGuideWizard'

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
  onWizardOpen?: () => void
}

const MAX_IMAGE_PX = 1024 // resize longest edge to this before sending

function readFileAsImage(file: File): Promise<ImageItem> {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) { reject(new Error('不是图片')); return }
    const reader = new FileReader()
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string
      const img = new Image()
      img.onload = () => {
        const { naturalWidth: w, naturalHeight: h } = img
        const scale = Math.min(1, MAX_IMAGE_PX / Math.max(w, h))
        const canvas = document.createElement('canvas')
        canvas.width = Math.round(w * scale)
        canvas.height = Math.round(h * scale)
        const ctx = canvas.getContext('2d')!
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
        // Use JPEG for photos (better compression), PNG for small images
        const outMime = file.type === 'image/png' && w * h < 500_000 ? 'image/png' : 'image/jpeg'
        const compressed = canvas.toDataURL(outMime, 0.88)
        resolve({ base64: compressed.split(',')[1], mime: outMime, preview: dataUrl })
      }
      img.onerror = reject
      img.src = dataUrl
    }
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

export default function AIChatPanel({ currentContent, onApply, collapsed, onToggleCollapse, onWizardOpen }: Props) {
  const [tab, setTab] = useState<InputTab>('text')
  const [input, setInput] = useState('')
  const [urlInput, setUrlInput] = useState('')
  const [images, setImages] = useState<ImageItem[]>([])
  const [isDragging, setIsDragging] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [generating, setGenerating] = useState(false)
  const [urlLoading, setUrlLoading] = useState(false)
  const [urlData, setUrlData] = useState<Record<string, unknown> | null>(null)
  const [guideMode, setGuideMode] = useState(false)

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
          mode: guideMode ? 'taste-guide' : isRefinement ? 'refine' : tab === 'image' ? 'image' : tab === 'url' ? 'url' : 'generate',
          description: input || undefined,
          images: !guideMode && tab === 'image' ? images.map(i => ({ base64: i.base64, mime: i.mime })) : undefined,
          urlData: !guideMode && tab === 'url' ? urlData : undefined,
          currentContent: !guideMode && isRefinement ? currentContent : undefined,
          history: messages.slice(-10).map(m => ({ role: m.role, content: m.content })),
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

  const handleStartGuide = useCallback(() => {
    setGuideMode(true)
    setMessages([])
    onWizardOpen?.()
  }, [onWizardOpen])

  const handleWizardGenerate = useCallback(async (prompt: string) => {
    setMessages([{ role: 'user', content: '（品味引导完成，正在生成 DESIGN.md…）' }])
    setGenerating(true)
    abortRef.current = new AbortController()

    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode: 'taste-guide', description: prompt }),
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

      setGenerating(false)
    } catch (e: unknown) {
      if ((e as Error).name !== 'AbortError') {
        setMessages(prev => [...prev, { role: 'assistant', content: '⚠️ 生成失败，请重试。' }])
      }
      setGenerating(false)
    }
  }, [])

  const handleExitGuide = useCallback(() => {
    setGuideMode(false)
    setMessages([])
  }, [])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const canSend = !generating && (
    guideMode ? !!input.trim() : (
      (tab === 'text' && !!input.trim()) ||
      (tab === 'image' && images.length > 0) ||
      (tab === 'url' && !!urlData && !urlData.error)
    )
  )

  // Detect if a message contains a generated DESIGN.md
  const isDesignMD = (content: string) =>
    content.includes('<!-- section:') && content.includes('meta:')

  const showWizard = guideMode && messages.length === 0
  const showInput = !guideMode || messages.length > 0

  return (
    <div className="flex flex-col h-full border-t" style={{ backgroundColor: 'var(--canvas)', borderColor: 'var(--hairline)' }}>

      {/* Header */}
      <div
        className="flex items-center justify-between px-4 py-2 border-b shrink-0 cursor-pointer select-none"
        style={{ borderColor: 'var(--hairline)' }}
        onClick={onToggleCollapse}
      >
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold" style={{ color: 'var(--ink)' }}>✦ AI 助手</span>
          {!collapsed && messages.length > 0 && (
            <span className="text-[10px]" style={{ color: 'var(--muted-soft)' }}>
              {messages.filter(m => m.role === 'assistant').length} 次对话
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {!collapsed && guideMode && (
            <span className="text-[10px] px-1.5 py-0.5 rounded font-medium" style={{ backgroundColor: 'var(--surface-card)', color: 'var(--muted)' }}>品味引导</span>
          )}
          {!collapsed && (guideMode || messages.length > 0) && (
            <button
              onClick={(e) => { e.stopPropagation(); guideMode ? handleExitGuide() : setMessages([]) }}
              className="text-[10px] transition-colors"
              style={{ color: 'var(--muted-soft)' }}
            >
              {guideMode ? (messages.length > 0 ? '退出引导' : '取消') : '清空'}
            </button>
          )}
          <svg
            className={`w-3.5 h-3.5 transition-transform ${collapsed ? 'rotate-180' : ''}`}
            style={{ color: 'var(--muted-soft)' }}
            fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>

      {/* Content area */}
      <div className="flex-1 overflow-y-auto min-h-0">
        {showWizard ? (
          <TasteGuideWizard onGenerate={handleWizardGenerate} />
        ) : (
          <div className="px-4 py-3 space-y-3">
            {messages.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full gap-3 text-center py-4">
                <button
                  onClick={handleStartGuide}
                  className="flex items-start gap-2 px-4 py-2.5 rounded-lg border transition-opacity hover:opacity-70"
                  style={{ backgroundColor: 'var(--surface-card)', borderColor: 'var(--hairline)' }}
                >
                  <span className="text-[12px] font-semibold leading-tight" style={{ color: 'var(--ink)' }}>✦</span>
                  <div className="text-left">
                    <div className="text-[12px] font-semibold leading-tight" style={{ color: 'var(--ink)' }}>从 0 开始</div>
                    <div className="text-[10px] mt-0.5" style={{ color: 'var(--muted)' }}>6 步生成 DESIGN.md</div>
                  </div>
                </button>
                <div className="flex items-center gap-2 w-full max-w-[220px]">
                  <div className="flex-1 h-px" style={{ backgroundColor: 'var(--hairline)' }} />
                  <span className="text-[10px]" style={{ color: 'var(--muted-soft)' }}>或直接描述</span>
                  <div className="flex-1 h-px" style={{ backgroundColor: 'var(--hairline)' }} />
                </div>
                <div className="flex flex-wrap justify-center gap-1.5">
                  {['蓝色调 SaaS，干净现代', '暖橙色餐饮 App', '深色科技游戏平台', '极简黑白设计工具'].map(ex => (
                    <button key={ex} onClick={() => { setTab('text'); setInput(ex) }}
                      className="text-[10px] px-2.5 py-1 rounded-full transition-opacity hover:opacity-70"
                      style={{ backgroundColor: 'var(--surface-card)', color: 'var(--muted)' }}>
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
                <div
                  className="rounded-xl px-3 py-2 text-[12px] leading-relaxed max-w-[85%]"
                  style={msg.role === 'user'
                    ? { backgroundColor: 'var(--ink)', color: '#ffffff' }
                    : { backgroundColor: 'var(--surface-card)', color: 'var(--body)' }}
                >
                  {msg.role === 'assistant' ? (
                    <div>
                      {guideMode ? (
                        isDesignMD(msg.content) ? (
                          <div>
                            <div className="flex items-center gap-1.5 mb-2">
                              <span className="text-[10px] font-semibold" style={{ color: 'var(--brand-lavender)' }}>✦ DESIGN.md 已生成</span>
                            </div>
                            <pre className="whitespace-pre-wrap font-mono text-[10px] leading-relaxed max-h-28 overflow-y-auto mb-2" style={{ color: 'var(--muted)' }}>
                              {msg.content.slice(0, 300)}{msg.content.length > 300 ? '\n…' : ''}
                            </pre>
                            <button
                              onClick={() => onApply(msg.content)}
                              disabled={generating || !msg.content}
                              className="w-full text-center text-[11px] font-semibold py-2 rounded-lg transition-opacity"
                              style={{
                                backgroundColor: (generating || !msg.content) ? 'var(--surface-strong)' : 'var(--ink)',
                                color: (generating || !msg.content) ? 'var(--muted-soft)' : '#ffffff',
                                cursor: (generating || !msg.content) ? 'not-allowed' : 'pointer',
                              }}
                            >
                              {generating ? '生成中…' : '✦ 写入编辑器'}
                            </button>
                          </div>
                        ) : (
                          <p className="whitespace-pre-wrap text-[12px] leading-relaxed">
                            {msg.content || <span className="animate-pulse" style={{ color: 'var(--muted-soft)' }}>思考中…</span>}
                          </p>
                        )
                      ) : (
                        <>
                          <pre className="whitespace-pre-wrap font-mono text-[10px] leading-relaxed max-h-32 overflow-y-auto">
                            {msg.content
                              ? msg.content.slice(0, 400) + (msg.content.length > 400 ? '\n…' : '')
                              : <span className="animate-pulse" style={{ color: 'var(--muted-soft)' }}>生成中…</span>}
                          </pre>
                          <div className="mt-2 flex gap-1.5">
                            <button
                              onClick={() => onApply(msg.content)}
                              disabled={!msg.content || generating}
                              className="flex-1 text-center text-[11px] font-medium py-1.5 rounded-lg transition-opacity"
                              style={{
                                backgroundColor: (!msg.content || generating) ? 'var(--surface-strong)' : 'var(--ink)',
                                color: (!msg.content || generating) ? 'var(--muted-soft)' : '#ffffff',
                                cursor: (!msg.content || generating) ? 'not-allowed' : 'pointer',
                              }}
                              title="替换编辑器中的全部内容"
                            >
                              覆盖
                            </button>
                            <button
                              onClick={() => {
                                const sep = currentContent.trimEnd() ? '\n\n' : ''
                                onApply(currentContent.trimEnd() + sep + msg.content)
                              }}
                              disabled={!msg.content || generating}
                              className="flex-1 text-center text-[11px] font-medium py-1.5 rounded-lg transition-opacity"
                              style={{
                                backgroundColor: 'var(--surface-strong)',
                                color: (!msg.content || generating) ? 'var(--muted-soft)' : 'var(--body)',
                                cursor: (!msg.content || generating) ? 'not-allowed' : 'pointer',
                              }}
                              title="追加到编辑器现有内容末尾"
                            >
                              追加
                            </button>
                          </div>
                        </>
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
                <div className="rounded-xl px-3 py-2 text-[11px] animate-pulse" style={{ backgroundColor: 'var(--surface-card)', color: 'var(--muted-soft)' }}>生成中…</div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input area */}
      {showInput && (
        <div className="shrink-0 border-t px-3 pt-2 pb-3" style={{ borderColor: 'var(--hairline)' }}>
          {!guideMode && (
            <div className="flex gap-1 mb-2">
              {(['text', 'image', 'url'] as InputTab[]).map(t => (
                <button key={t} onClick={() => setTab(t)}
                  className="text-[11px] px-2.5 py-1 rounded-md transition-opacity font-medium"
                  style={tab === t
                    ? { backgroundColor: 'var(--ink)', color: '#ffffff' }
                    : { backgroundColor: 'var(--surface-card)', color: 'var(--muted)' }}>
                  {t === 'text' ? '📝 文字' : t === 'image' ? '🖼️ 图片' : '🔗 网址'}
                </button>
              ))}
              {messages.length > 0 && (
                <span className="ml-auto text-[10px] self-center" style={{ color: 'var(--muted-soft)' }}>可继续对话优化</span>
              )}
            </div>
          )}

          {guideMode && (
            <div className="relative mb-1">
              <textarea value={input} onChange={e => setInput(e.target.value)} onKeyDown={handleKeyDown}
                placeholder="回复 AI… （回车发送，Shift+回车换行）"
                className="w-full text-xs border rounded-lg px-3 pt-2 pb-8 resize-none focus:outline-none h-16"
                style={{ backgroundColor: 'var(--canvas)', borderColor: 'var(--hairline)', color: 'var(--body-strong)' }}
                disabled={generating} />
              <button onClick={handleSend} disabled={!canSend}
                className="absolute bottom-3 right-3 px-2.5 py-1 rounded-md text-[11px] font-medium text-white disabled:opacity-40 transition-opacity hover:opacity-80"
                style={{ backgroundColor: 'var(--ink)' }}>
                {generating ? '…' : '发送'}
              </button>
            </div>
          )}

          {!guideMode && tab === 'text' && (
            <div className="relative">
              <textarea value={input} onChange={e => setInput(e.target.value)} onKeyDown={handleKeyDown}
                placeholder={messages.length > 0 ? '继续优化… （回车发送，Shift+回车换行）' : '描述你的产品风格… （回车发送，Shift+回车换行）'}
                className="w-full text-xs border rounded-lg px-3 pt-2 pb-8 resize-none focus:outline-none h-16"
                style={{ backgroundColor: 'var(--canvas)', borderColor: 'var(--hairline)', color: 'var(--body-strong)' }}
                disabled={generating} />
              <button onClick={handleSend} disabled={!canSend}
                className="absolute bottom-3 right-3 px-2.5 py-1 rounded-md text-[11px] font-medium text-white disabled:opacity-40 transition-opacity hover:opacity-80"
                style={{ backgroundColor: 'var(--ink)' }}>
                {generating ? '…' : '发送'}
              </button>
            </div>
          )}

          {!guideMode && tab === 'image' && (
            <div className="space-y-2">
              <div
                ref={dropZoneRef}
                onClick={() => fileInputRef.current?.click()}
                onDragOver={e => { e.preventDefault(); setIsDragging(true) }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
                className="border-2 border-dashed rounded-lg p-3 text-center cursor-pointer transition-colors"
                style={{ borderColor: isDragging ? 'var(--brand-lavender)' : 'var(--hairline)', backgroundColor: isDragging ? 'var(--surface-soft)' : 'transparent' }}
              >
                {images.length > 0 ? (
                  <div className="flex gap-2 flex-wrap justify-center" onClick={e => e.stopPropagation()}>
                    {images.map((img, i) => (
                      <div key={i} className="relative group">
                        <img src={img.preview} alt="" className="h-16 w-16 object-cover rounded-lg border" style={{ borderColor: 'var(--hairline)' }} />
                        <button onClick={() => removeImage(i)}
                          className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full text-white text-[9px] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                          style={{ backgroundColor: 'var(--ink)' }}>
                          ✕
                        </button>
                      </div>
                    ))}
                    {images.length < 4 && (
                      <button onClick={() => fileInputRef.current?.click()}
                        className="h-16 w-16 rounded-lg border-2 border-dashed text-xl flex items-center justify-center transition-colors"
                        style={{ borderColor: 'var(--hairline)', color: 'var(--muted-soft)' }}>
                        +
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="py-1">
                    <p className="text-[11px]" style={{ color: 'var(--muted)' }}>点击上传 / 拖入 / ⌘V 粘贴</p>
                    <p className="text-[10px] mt-0.5" style={{ color: 'var(--muted-soft)' }}>支持多张，最多 8 张</p>
                  </div>
                )}
              </div>
              <input ref={fileInputRef} type="file" accept="image/*" multiple className="hidden" onChange={handleFileInput} />
              <div className="flex gap-2">
                <input value={input} onChange={e => setInput(e.target.value)} placeholder="补充说明（可选）"
                  className="flex-1 text-xs border rounded-lg px-3 py-1.5 focus:outline-none"
                  style={{ backgroundColor: 'var(--canvas)', borderColor: 'var(--hairline)', color: 'var(--body-strong)' }}
                  disabled={generating} />
                <button onClick={handleSend} disabled={!canSend}
                  className="px-3 rounded-lg text-xs font-medium text-white h-8 disabled:opacity-40 transition-opacity hover:opacity-80"
                  style={{ backgroundColor: 'var(--ink)' }}>
                  分析
                </button>
              </div>
            </div>
          )}

          {!guideMode && tab === 'url' && (
            <div className="space-y-2">
              <div className="flex gap-2">
                <input value={urlInput} onChange={e => { setUrlInput(e.target.value); setUrlData(null) }}
                  onKeyDown={e => e.key === 'Enter' && handleFetchUrl()}
                  placeholder="https://example.com"
                  className="flex-1 text-xs border rounded-lg px-3 py-1.5 focus:outline-none font-mono"
                  style={{ backgroundColor: 'var(--canvas)', borderColor: 'var(--hairline)', color: 'var(--body-strong)' }}
                  disabled={urlLoading || generating} />
                <button onClick={handleFetchUrl} disabled={!urlInput.trim() || urlLoading}
                  className="px-3 rounded-lg text-xs font-medium h-8 disabled:opacity-40 transition-opacity hover:opacity-70"
                  style={{ backgroundColor: 'var(--surface-card)', color: 'var(--body)' }}>
                  {urlLoading ? '…' : '抓取'}
                </button>
              </div>
              {urlData && !urlData.error && (
                <div className="text-[10px] rounded-lg px-3 py-2" style={{ backgroundColor: 'var(--surface-soft)', color: 'var(--muted)' }}>
                  ✓ 已提取 {(urlData.colors as string[])?.length ?? 0} 个色值、{(urlData.fonts as string[])?.length ?? 0} 个字体
                  {urlData.title ? `（${urlData.title}）` : ''}
                </div>
              )}
              {!!urlData?.error && <p className="text-[10px] text-red-500">⚠ {String(urlData.error)}</p>}
              <div className="flex gap-2">
                <input value={input} onChange={e => setInput(e.target.value)} placeholder="补充说明（可选）"
                  className="flex-1 text-xs border rounded-lg px-3 py-1.5 focus:outline-none"
                  style={{ backgroundColor: 'var(--canvas)', borderColor: 'var(--hairline)', color: 'var(--body-strong)' }}
                  disabled={generating} />
                <button onClick={handleSend} disabled={!canSend}
                  className="px-3 rounded-lg text-xs font-medium text-white h-8 disabled:opacity-40 transition-opacity hover:opacity-80"
                  style={{ backgroundColor: 'var(--ink)' }}>
                  分析
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
