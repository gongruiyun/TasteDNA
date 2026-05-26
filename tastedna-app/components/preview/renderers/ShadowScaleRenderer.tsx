'use client'

import type { TokenNode } from '@/lib/parser/types'

interface Props {
  tokens: TokenNode[]
  onTokenClick?: (line: number) => void
  cssVarMap?: Record<string, string[]>
}

export default function ShadowScaleRenderer({ tokens, onTokenClick, cssVarMap }: Props) {
  return (
    <div className="flex flex-wrap gap-6">
      {tokens.map((token) => (
        <button
          key={`${token.name}-${token.line}`}
          data-line={token.line}
          onClick={() => onTokenClick?.(token.line)}
          className="flex flex-col items-center gap-3 cursor-pointer hover:scale-105 transition-transform"
        >
          <div
            className="w-20 h-20 bg-white rounded-xl border border-neutral-100"
            style={{ boxShadow: token.value === 'none' ? 'none' : token.value }}
          />
          <div className="text-center">
            <p className="text-xs font-medium text-neutral-600">{token.name}</p>
            {token.zh && <p className="text-[10px] text-neutral-400">{token.zh}</p>}
            {cssVarMap?.[token.name]?.[0] && (
              <p className="text-[10px] font-mono text-indigo-300 mt-0.5">{cssVarMap[token.name][0]}</p>
            )}
          </div>
        </button>
      ))}
    </div>
  )
}
