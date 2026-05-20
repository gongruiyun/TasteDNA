'use client'

import { useRef } from 'react'
import type { TokenNode } from '@/lib/parser/types'
import { useLanguage } from '@/lib/i18n'

interface Props {
  tokens: TokenNode[]
  onTokenClick?: (line: number) => void
  onTokenColorChange?: (line: number, color: string) => void
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

function toHex6(hex: string): string {
  const clean = hex.replace('#', '')
  if (clean.length === 8) return '#' + clean.slice(0, 6)
  if (clean.length === 3) return '#' + clean.split('').map(c => c + c).join('')
  return hex.startsWith('#') && clean.length === 6 ? hex : '#000000'
}

function ColorSwatch({ token, onTokenClick, onTokenColorChange }: {
  token: TokenNode
  onTokenClick?: (line: number) => void
  onTokenColorChange?: (line: number, color: string) => void
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const { t } = useLanguage()
  const color = extractColor(token.value) ?? token.value

  return (
    <div
      className="group flex flex-col gap-2 cursor-pointer hover:scale-105 transition-transform"
      onClick={() => onTokenClick?.(token.line)}
    >
      <div className="relative">
        <div
          className="w-16 h-16 rounded-xl border border-black/[0.06] shadow-sm group-hover:shadow-md transition-shadow"
          style={{ backgroundColor: color }}
        />
        {onTokenColorChange && (
          <button
            className="absolute top-1 right-1 w-5 h-5 rounded-md opacity-0 group-hover:opacity-100 flex items-center justify-center bg-black/30 hover:bg-black/50 transition-opacity"
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
      <div className="text-left">
        <p className="text-xs font-medium text-neutral-700 leading-none">{token.name}</p>
        <p className="text-[11px] text-neutral-400 font-mono mt-0.5">{color.toUpperCase()}</p>
        {token.zh && (
          <p className="text-[10px] text-neutral-400 mt-0.5 max-w-[64px] leading-tight">{token.zh}</p>
        )}
      </div>
    </div>
  )
}

export default function ColorGroupRenderer({ tokens, onTokenClick, onTokenColorChange }: Props) {
  return (
    <div className="flex flex-wrap gap-3">
      {tokens.map((token) => (
        <ColorSwatch
          key={`${token.name}-${token.line}`}
          token={token}
          onTokenClick={onTokenClick}
          onTokenColorChange={onTokenColorChange}
        />
      ))}
    </div>
  )
}
