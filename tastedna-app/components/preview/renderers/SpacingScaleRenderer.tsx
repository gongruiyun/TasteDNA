'use client'

import type { TokenNode } from '@/lib/parser/types'

interface Props {
  tokens: TokenNode[]
  onTokenClick?: (line: number) => void
  cssVarMap?: Record<string, string[]>
}

function pxToNumber(value: string): number {
  return parseInt(value.replace('px', ''), 10) || 0
}

export default function SpacingScaleRenderer({ tokens, onTokenClick, cssVarMap }: Props) {
  return (
    <div className="space-y-2">
      {tokens.map((token) => {
        const px = pxToNumber(token.value)
        const barWidth = Math.min(px * 2, 320)
        return (
          <button
            key={`${token.name}-${token.line}`}
            data-line={token.line}
            onClick={() => onTokenClick?.(token.line)}
            className="w-full flex items-center gap-3 hover:bg-neutral-50 rounded-lg px-2 py-1.5 -mx-2 transition-colors text-left"
          >
            <span className="text-[11px] text-neutral-400 font-mono w-6 shrink-0 text-right">{token.name}</span>
            <div
              className="h-5 rounded bg-indigo-100 shrink-0 min-w-[4px]"
              style={{ width: Math.max(barWidth, 4) }}
            />
            <span className="text-[11px] text-neutral-500 font-mono">{token.value}</span>
            {cssVarMap?.[token.name]?.[0] && (
              <span className="text-[10px] font-mono text-indigo-300 ml-auto shrink-0">{cssVarMap[token.name][0]}</span>
            )}
            {token.zh && (
              <span className="text-[11px] text-neutral-400 shrink-0 hidden sm:block">{token.zh}</span>
            )}
          </button>
        )
      })}
    </div>
  )
}
