'use client'

import type { TokenNode } from '@/lib/parser/types'

interface Props {
  tokens: TokenNode[]
  onTokenClick?: (line: number) => void
}

function extractColor(value: string): string {
  const m = value.match(/#[0-9A-Fa-f]{3,8}/)
  return m ? m[0] : value
}

export default function ColorScaleRenderer({ tokens, onTokenClick }: Props) {
  return (
    <div className="space-y-1">
      {/* Horizontal strip */}
      <div className="flex rounded-xl overflow-hidden h-12 border border-black/[0.06]">
        {tokens.map((token) => {
          const color = extractColor(token.value)
          return (
            <button
              key={`${token.name}-${token.line}`}
              data-line={token.line}
              onClick={() => onTokenClick?.(token.line)}
              className="flex-1 hover:opacity-80 transition-opacity"
              style={{ backgroundColor: color }}
              title={`${token.name}: ${color}`}
            />
          )
        })}
      </div>
      {/* Labels */}
      <div className="flex">
        {tokens.map((token) => {
          const color = extractColor(token.value)
          return (
            <button
              key={`${token.name}-${token.line}`}
              data-line={token.line}
              onClick={() => onTokenClick?.(token.line)}
              className="flex-1 text-center"
            >
              <p className="text-[10px] text-neutral-500 font-mono">{token.name.split('-').pop()}</p>
              <p className="text-[9px] text-neutral-400 font-mono">{color.toUpperCase()}</p>
            </button>
          )
        })}
      </div>
    </div>
  )
}
