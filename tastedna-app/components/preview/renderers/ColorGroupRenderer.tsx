'use client'

import type { TokenNode } from '@/lib/parser/types'

interface Props {
  tokens: TokenNode[]
  onTokenClick?: (line: number) => void
}

function isLight(hex: string): boolean {
  const clean = hex.replace('#', '')
  if (clean.length < 6) return true
  const r = parseInt(clean.slice(0, 2), 16)
  const g = parseInt(clean.slice(2, 4), 16)
  const b = parseInt(clean.slice(4, 6), 16)
  return (r * 299 + g * 587 + b * 114) / 1000 > 128
}

function extractColor(value: string): string | null {
  const m = value.match(/#[0-9A-Fa-f]{3,8}/)
  return m ? m[0] : null
}

export default function ColorGroupRenderer({ tokens, onTokenClick }: Props) {
  return (
    <div className="flex flex-wrap gap-3">
      {tokens.map((token) => {
        const color = extractColor(token.value) ?? token.value
        const light = isLight(color)
        return (
          <button
            key={`${token.name}-${token.line}`}
            data-line={token.line}
            onClick={() => onTokenClick?.(token.line)}
            className="group flex flex-col gap-2 cursor-pointer hover:scale-105 transition-transform"
            title={`点击定位到第 ${token.line} 行`}
          >
            <div
              className="w-16 h-16 rounded-xl border border-black/[0.06] shadow-sm group-hover:shadow-md transition-shadow"
              style={{ backgroundColor: color }}
            />
            <div className="text-left">
              <p className="text-xs font-medium text-neutral-700 leading-none">{token.name}</p>
              <p className="text-[11px] text-neutral-400 font-mono mt-0.5">{color.toUpperCase()}</p>
              {token.zh && (
                <p className="text-[10px] text-neutral-400 mt-0.5 max-w-[64px] leading-tight">{token.zh}</p>
              )}
            </div>
          </button>
        )
      })}
    </div>
  )
}
