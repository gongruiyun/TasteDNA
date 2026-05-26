'use client'

import { useState, useMemo } from 'react'
import type { TokenNode } from '@/lib/parser/types'
import { copyText } from '@/lib/utils/clipboard'

interface Props {
  tokens: TokenNode[]
  subsectionTitle: string
  onTokenClick?: (line: number) => void
}

// ── helpers ──────────────────────────────────────────────────────────────────

function formatBlock(title: string, tokens: TokenNode[]): string {
  const lines: string[] = [
    `### ${title}`,
    `<!-- type: spec -->`,
  ]
  for (const t of tokens) {
    const comment = t.zh ? `  // ${t.zh}` : ''
    lines.push(`- ${t.name}: ${t.value}${comment}`)
  }
  return lines.join('\n')
}

// Syntax-highlight a single formatted line
function HighlightedLine({ line }: { line: string }) {
  if (line.startsWith('###')) {
    return <div><span style={{ color: '#818cf8' }}>{line}</span></div>
  }
  if (line.startsWith('<!--')) {
    return <div><span style={{ color: 'var(--muted-soft, #a3a3a3)' }}>{line}</span></div>
  }
  const colonIdx = line.indexOf(': ', 2)
  if (colonIdx > 0 && line.startsWith('- ')) {
    const key = line.slice(2, colonIdx)
    const rest = line.slice(colonIdx + 2)
    // Split comment from value
    const commentIdx = rest.indexOf('  //')
    const val = commentIdx >= 0 ? rest.slice(0, commentIdx) : rest
    const comment = commentIdx >= 0 ? rest.slice(commentIdx) : ''
    const keyColor =
      key === 'prohibited' ? '#f87171'
      : key === 'usage'    ? '#4ade80'
      : '#fb923c'
    return (
      <div>
        <span style={{ color: 'var(--muted-soft, #a3a3a3)' }}>{'- '}</span>
        <span style={{ color: keyColor }}>{key}</span>
        <span style={{ color: 'var(--muted-soft, #a3a3a3)' }}>{': '}</span>
        <span style={{ color: 'var(--body, #3a3a3a)' }}>{val}</span>
        {comment && <span style={{ color: 'var(--muted-soft, #a3a3a3)' }}>{comment}</span>}
      </div>
    )
  }
  return <div>{line}</div>
}

// ── component ─────────────────────────────────────────────────────────────────

export default function IconStyleSpecRenderer({ tokens, subsectionTitle, onTokenClick }: Props) {
  const [editing, setEditing] = useState(false)
  const [editText, setEditText] = useState('')
  const [copied, setCopied] = useState(false)

  const formatted = useMemo(() => formatBlock(subsectionTitle, tokens), [subsectionTitle, tokens])

  const enterEdit = () => {
    setEditText(formatted)
    setEditing(true)
  }

  const exitEdit = () => setEditing(false)

  const handleCopy = async () => {
    await copyText(editing ? editText : formatted)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const lineCount = (editing ? editText : formatted).split('\n').length

  return (
    <div
      className="rounded-xl overflow-hidden"
      style={{ border: '1px solid var(--hairline)', backgroundColor: 'var(--surface-card)' }}
    >
      {/* ── Header bar ── */}
      <div
        className="flex items-center justify-between px-3.5 py-2 border-b"
        style={{ borderColor: 'var(--hairline)' }}
      >
        <span className="text-[11px] font-mono tracking-wide" style={{ color: 'var(--muted)' }}>
          DESIGN.md icon-style 结构
        </span>
        <div className="flex items-center gap-1.5">
          {editing ? (
            <button
              onClick={exitEdit}
              className="text-[11px] font-medium px-2 py-0.5 rounded transition-opacity hover:opacity-70"
              style={{ color: 'var(--body)', backgroundColor: 'var(--hairline)' }}
            >
              完成
            </button>
          ) : (
            <button
              onClick={enterEdit}
              className="flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded transition-opacity hover:opacity-70"
              style={{ color: 'var(--muted)', backgroundColor: 'var(--hairline)' }}
            >
              {/* pencil icon */}
              <svg width="10" height="10" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M11 2l3 3-9 9H2v-3L11 2z" />
              </svg>
              编辑
            </button>
          )}
          <button
            onClick={handleCopy}
            className="flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded transition-opacity hover:opacity-70"
            style={{
              color: copied ? '#4ade80' : 'var(--muted)',
              backgroundColor: copied ? '#4ade8022' : 'var(--hairline)',
            }}
          >
            {copied ? (
              <svg width="10" height="10" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 8l4 4 6-6" />
              </svg>
            ) : (
              <svg width="10" height="10" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <rect x="5" y="5" width="9" height="9" rx="1.5" />
                <path d="M11 5V3.5A1.5 1.5 0 0 0 9.5 2h-6A1.5 1.5 0 0 0 2 3.5v6A1.5 1.5 0 0 0 3.5 11H5" />
              </svg>
            )}
            {copied ? '已复制' : '复制'}
          </button>
        </div>
      </div>

      {/* ── Content ── */}
      {editing ? (
        <textarea
          value={editText}
          onChange={e => setEditText(e.target.value)}
          rows={lineCount + 1}
          spellCheck={false}
          className="w-full p-4 text-[13px] font-mono leading-relaxed resize-none outline-none"
          style={{
            backgroundColor: 'var(--surface-card)',
            color: 'var(--body)',
            minHeight: '160px',
          }}
        />
      ) : (
        <pre
          onClick={enterEdit}
          title="点击编辑"
          className="p-4 text-[13px] font-mono leading-relaxed overflow-x-auto whitespace-pre-wrap break-words cursor-text select-text"
          style={{ color: 'var(--body)' }}
        >
          {formatted.split('\n').map((line, i) => (
            <HighlightedLine key={i} line={line} />
          ))}
        </pre>
      )}
    </div>
  )
}
