'use client'

import type { TokenNode } from '@/lib/parser/types'

interface Props {
  tokens: TokenNode[]
  onTokenClick?: (line: number) => void
  cssVarMap?: Record<string, string[]>
}

function parseTypeToken(value: string): { size: string; lineHeight: string; weight: string } {
  // Format: "14px / 1.6 / 400"
  const parts = value.split('/').map(s => s.trim())
  return {
    size: parts[0] ?? '14px',
    lineHeight: parts[1] ?? '1.5',
    weight: parts[2] ?? '400',
  }
}

const weightName: Record<string, string> = {
  '300': 'Light',
  '400': 'Regular',
  '500': 'Medium',
  '600': 'SemiBold',
  '700': 'Bold',
  '800': 'ExtraBold',
}

export default function TypeScaleRenderer({ tokens, onTokenClick, cssVarMap }: Props) {
  return (
    <div className="space-y-1 divide-y divide-neutral-100">
      {tokens.map((token) => {
        const { size, lineHeight, weight } = parseTypeToken(token.value)
        const fontSize = size
        const fontWeight = weight
        return (
          <button
            key={`${token.name}-${token.line}`}
            data-line={token.line}
            onClick={() => onTokenClick?.(token.line)}
            className="w-full flex items-baseline gap-4 py-3 hover:bg-neutral-50 rounded-lg px-2 -mx-2 transition-colors text-left"
          >
            <span className="text-[11px] text-neutral-400 w-8 shrink-0 font-mono">{token.name}</span>
            <span
              style={{ fontSize, fontWeight, lineHeight }}
              className="text-neutral-800 flex-1 truncate"
            >
              设计系统 Design System
            </span>
            <span className="text-[11px] text-neutral-400 shrink-0 font-mono">
              {size} / {lineHeight} / {weightName[weight] ?? weight}
            </span>
            {token.zh && (
              <span className="text-[11px] text-neutral-400 shrink-0 hidden sm:block">{token.zh}</span>
            )}
            {cssVarMap?.[token.name] && (
              <span className="text-[10px] font-mono text-indigo-300 shrink-0 hidden sm:block">
                {cssVarMap[token.name].join(' · ')}
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}
