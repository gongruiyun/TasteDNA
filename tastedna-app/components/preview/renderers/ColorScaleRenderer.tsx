'use client'

import { useRef } from 'react'
import type { TokenNode } from '@/lib/parser/types'
import { useLanguage } from '@/lib/i18n'

interface Props {
  tokens: TokenNode[]
  onTokenClick?: (line: number) => void
  onTokenColorChange?: (line: number, color: string) => void
}

function extractColor(value: string): string {
  const m = value.match(/#[0-9A-Fa-f]{3,8}/)
  return m ? m[0] : value
}

function toHex6(hex: string): string {
  const clean = hex.replace('#', '')
  if (clean.length === 8) return '#' + clean.slice(0, 6)
  if (clean.length === 3) return '#' + clean.split('').map(c => c + c).join('')
  return hex.startsWith('#') && clean.length === 6 ? hex : '#000000'
}

function ScaleSwatch({ token, onTokenClick, onTokenColorChange }: {
  token: TokenNode
  onTokenClick?: (line: number) => void
  onTokenColorChange?: (line: number, color: string) => void
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const { t } = useLanguage()
  const color = extractColor(token.value)

  return (
    <div className="flex-1 group relative">
      <div
        className="h-12 hover:opacity-80 transition-opacity cursor-pointer"
        style={{ backgroundColor: color }}
        onClick={() => onTokenClick?.(token.line)}
        title={`${token.name}: ${color}`}
      />
      {onTokenColorChange && (
        <button
          className="absolute top-1 right-1 w-5 h-5 rounded opacity-0 group-hover:opacity-100 flex items-center justify-center bg-black/30 hover:bg-black/50 transition-opacity"
          title={t('pickColor')}
          onClick={(e) => { e.stopPropagation(); inputRef.current?.click() }}
        >
          <span className="text-white text-[10px] leading-none">✎</span>
        </button>
      )}
      <input
        ref={inputRef}
        type="color"
        className="sr-only"
        value={toHex6(color)}
        onChange={(e) => onTokenColorChange?.(token.line, e.target.value)}
        onClick={(e) => e.stopPropagation()}
      />
    </div>
  )
}

export default function ColorScaleRenderer({ tokens, onTokenClick, onTokenColorChange }: Props) {
  return (
    <div className="space-y-1">
      {/* Horizontal strip */}
      <div className="flex rounded-xl overflow-hidden h-12 border border-black/[0.06]">
        {tokens.map((token) => (
          <ScaleSwatch
            key={`${token.name}-${token.line}`}
            token={token}
            onTokenClick={onTokenClick}
            onTokenColorChange={onTokenColorChange}
          />
        ))}
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
