'use client'

import type { TokenNode } from '@/lib/parser/types'

interface Props {
  tokens: TokenNode[]
  onTokenClick?: (line: number) => void
  cssVarMap?: Record<string, string[]>
}

export default function BorderRadiusRenderer({ tokens, onTokenClick, cssVarMap }: Props) {
  return (
    <div className="flex flex-wrap gap-5">
      {tokens.map((token) => {
        const radius = token.value === '9999px' ? '50%' : token.value
        return (
          <button
            key={`${token.name}-${token.line}`}
            data-line={token.line}
            onClick={() => onTokenClick?.(token.line)}
            className="flex flex-col items-center gap-2 cursor-pointer hover:scale-105 transition-transform"
          >
            <div
              className="w-14 h-14 bg-indigo-100 border-2 border-indigo-200"
              style={{ borderRadius: radius }}
            />
            <div className="text-center">
              <p className="text-[11px] font-medium text-neutral-600">{token.name}</p>
              <p className="text-[10px] text-neutral-400 font-mono">{token.value}</p>
              {cssVarMap?.[token.name]?.[0] && (
                <p className="text-[10px] font-mono text-indigo-300 mt-0.5">{cssVarMap[token.name][0]}</p>
              )}
            </div>
          </button>
        )
      })}
    </div>
  )
}
