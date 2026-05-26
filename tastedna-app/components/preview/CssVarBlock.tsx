'use client'

import { useState } from 'react'
import { copyText } from '@/lib/utils/clipboard'
import type { CssVar } from '@/lib/css-token-name'

interface Props {
  /** Structured CSS vars (design tokens) */
  vars?: CssVar[]
  /** Raw CSS string (component classes) — overrides vars rendering */
  raw?: string
  /** subsection title — used as copy aria-label */
  label?: string
}

export default function CssVarBlock({ vars, raw, label }: Props) {
  const [copied, setCopied] = useState(false)

  // Determine mode
  const isRaw = !!raw
  const text = isRaw
    ? raw
    : (vars ?? []).map(v => `${v.name}: ${v.value};${v.comment ? `  /* ${v.comment} */` : ''}`).join('\n')

  if (!text) return null

  const handleCopy = async () => {
    await copyText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div
      className="relative group/css rounded-lg overflow-hidden text-[12px] font-mono"
      style={{ backgroundColor: '#161b2e' }}
    >
      {/* Copy button */}
      <button
        onClick={handleCopy}
        className="absolute top-2.5 right-2.5 flex items-center gap-1 px-2 py-1 rounded transition-all opacity-0 group-hover/css:opacity-100"
        style={{
          backgroundColor: copied ? '#22c55e22' : 'rgba(255,255,255,0.08)',
          color: copied ? '#4ade80' : 'rgba(255,255,255,0.45)',
          fontSize: '11px',
        }}
        title={`复制 ${label ?? ''} CSS 变量`}
      >
        {copied ? (
          <>
            <svg width="11" height="11" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 8l4 4 6-6" />
            </svg>
            已复制
          </>
        ) : (
          <>
            <svg width="11" height="11" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="5" y="5" width="9" height="9" rx="1.5" />
              <path d="M11 5V3.5A1.5 1.5 0 0 0 9.5 2h-6A1.5 1.5 0 0 0 2 3.5v6A1.5 1.5 0 0 0 3.5 11H5" />
            </svg>
            复制
          </>
        )}
      </button>

      {/* Code lines */}
      <div className="px-4 py-3.5 overflow-x-auto">
        {isRaw
          ? <RawCss code={text} />
          : (vars ?? []).map((v, i) => <CssLine key={i} v={v} />)
        }
      </div>
    </div>
  )
}

/** Renders raw CSS string with basic line-level syntax coloring */
function RawCss({ code }: { code: string }) {
  return (
    <div className="leading-6">
      {code.split('\n').map((line, i) => {
        const trimmed = line.trim()
        // Comment line
        if (trimmed.startsWith('/*')) {
          return <div key={i} style={{ color: '#3f4f6a' }}>{line}</div>
        }
        // Closing brace
        if (trimmed === '}') {
          return <div key={i} style={{ color: '#475569' }}>{line}</div>
        }
        // Selector line (.foo {)
        if (trimmed.startsWith('.') || trimmed.startsWith('@')) {
          const braceIdx = line.indexOf('{')
          if (braceIdx > -1) {
            // Could be single-line: ".btn-sm { height: 28px; }"
            const selector = line.slice(0, braceIdx + 1)
            const rest = line.slice(braceIdx + 1)
            return (
              <div key={i} className="whitespace-nowrap">
                <span style={{ color: '#c4b5fd' }}>{selector}</span>
                {rest && <InlineDecls code={rest} />}
              </div>
            )
          }
          return <div key={i} style={{ color: '#c4b5fd' }}>{line}</div>
        }
        // Property: value; line
        if (trimmed.includes(':') && !trimmed.startsWith('//')) {
          const colonIdx = line.indexOf(':')
          const prop = line.slice(0, colonIdx)
          const rest = line.slice(colonIdx + 1)
          // Check for color value in rest
          const colorMatch = rest.match(/#[0-9A-Fa-f]{3,8}/)
          return (
            <div key={i} className="flex items-baseline whitespace-nowrap">
              <span style={{ color: '#93c5fd' }}>{prop}</span>
              <span style={{ color: '#64748b' }}>:</span>
              {colorMatch && (
                <span
                  className="inline-block w-2.5 h-2.5 rounded-sm mx-1 shrink-0 self-center border border-white/10"
                  style={{ backgroundColor: colorMatch[0] }}
                />
              )}
              <span style={{ color: '#86efac' }}>{rest}</span>
            </div>
          )
        }
        // Empty / other
        return <div key={i} style={{ color: '#475569' }}>{line || ' '}</div>
      })}
    </div>
  )
}

/** Colorise declarations inside a single-line rule: "{ height: 28px; }" */
function InlineDecls({ code }: { code: string }) {
  // code = " height: 28px; }"
  const inner = code.replace(/^\s*\{?\s*/, '').replace(/\s*\}\s*$/, '')
  const closing = code.includes('}') ? ' }' : ''
  if (!inner) return <span style={{ color: '#475569' }}>{code}</span>
  const colonIdx = inner.indexOf(':')
  if (colonIdx === -1) return <span style={{ color: '#86efac' }}> {inner}{closing}</span>
  const prop = inner.slice(0, colonIdx)
  const val = inner.slice(colonIdx + 1).replace(/;?\s*$/, '')
  return (
    <>
      <span style={{ color: '#64748b' }}> </span>
      <span style={{ color: '#93c5fd' }}>{prop}</span>
      <span style={{ color: '#64748b' }}>: </span>
      <span style={{ color: '#86efac' }}>{val}</span>
      <span style={{ color: '#64748b' }}>;</span>
      <span style={{ color: '#475569' }}>{closing}</span>
    </>
  )
}

function CssLine({ v }: { v: CssVar }) {
  // Split value into color swatch + text where applicable
  const colorMatch = v.value.match(/^(#[0-9A-Fa-f]{3,8}|rgba?\([^)]+\))/)

  return (
    <div className="flex items-baseline gap-0 leading-6 whitespace-nowrap">
      {/* var name */}
      <span style={{ color: '#93c5fd' }}>{v.name}</span>
      {/* colon */}
      <span style={{ color: '#64748b' }}>: </span>
      {/* optional color swatch */}
      {colorMatch && (
        <span
          className="inline-block w-2.5 h-2.5 rounded-sm mr-1 shrink-0 self-center border border-white/10"
          style={{ backgroundColor: colorMatch[0] }}
        />
      )}
      {/* value */}
      <span style={{ color: '#86efac' }}>{v.value}</span>
      {/* semicolon */}
      <span style={{ color: '#64748b' }}>;</span>
      {/* comment */}
      {v.comment && (
        <span className="ml-3" style={{ color: '#3f4f6a' }}>{'/* '}{v.comment}{' */'}</span>
      )}
    </div>
  )
}
