'use client'

import type { TokenNode } from '@/lib/parser/types'

interface Props {
  tokens: TokenNode[]
  onTokenClick?: (line: number) => void
}

export default function GradientRenderer({ tokens, onTokenClick }: Props) {
  return (
    <div className="flex flex-wrap gap-4">
      {tokens.map((token) => (
        <button
          key={`${token.name}-${token.line}`}
          data-line={token.line}
          onClick={() => onTokenClick?.(token.line)}
          className="group flex flex-col gap-2 cursor-pointer"
        >
          <div
            className="w-40 h-20 rounded-xl border border-black/[0.06] shadow-sm group-hover:shadow-md transition-shadow"
            style={{ background: token.value }}
          />
          <div className="text-left">
            <p className="text-xs font-medium text-neutral-700">{token.name}</p>
            {token.zh && <p className="text-[10px] text-neutral-400">{token.zh}</p>}
          </div>
        </button>
      ))}
    </div>
  )
}
