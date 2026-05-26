/**
 * Shared CSS variable naming logic.
 * Mirrors the prefix logic in css-exporter.ts so preview and exporter stay in sync.
 */

import type { SubsectionNode, TokenNode } from './parser/types'

// ─── skip lists (must match css-exporter.ts) ────────────────────────────────

export const CSS_SKIP_SECTIONS = new Set([
  'components',
  'illustration-style',
  'icon-style',
  'ai-context',
  'design-language',
  'brand',
])

export const CSS_SKIP_TYPES = new Set([
  'animation-pattern',
  'text',
  'ai-prompt',
  'rules',
  'list',
  'spec',
  'component-spec',
])

// ─── var name helpers ────────────────────────────────────────────────────────

function prefix(sectionId: string, subId: string, type: string): string {
  if (sectionId === 'colors')     return 'color'
  if (sectionId === 'typography') {
    if (type === 'font-list')     return 'font'
    return ''                     // type-scale handled separately
  }
  if (sectionId === 'spacing') {
    if (subId === 'layout')       return ''
    if (subId === 'breakpoints')  return 'screen'
    return 'space'
  }
  if (sectionId === 'borders') {
    if (subId === 'radius' || subId.includes('radius')) return 'radius'
    return 'border'
  }
  if (sectionId === 'radius')     return 'radius'
  if (sectionId === 'shadows')    return 'shadow'
  if (sectionId === 'motion') {
    if (type === 'easing-group')  return 'ease'
    if (type === 'scale')         return 'duration'
    return 'motion'
  }
  return sectionId.replace(/[^a-z0-9]/g, '-')
}

function parseTypeScale(value: string) {
  const parts = value.split('/').map(p => p.trim())
  if (parts.length >= 2) {
    return { size: parts[0] ?? '', lineHeight: parts[1] ?? '', weight: parts[2] ?? '' }
  }
  const m = value.match(/^([^\s/]+)\s*\/\s*([^\s/]+)(?:\s*\/\s*([^\s/]+))?$/)
  if (m) return { size: m[1], lineHeight: m[2], weight: m[3] ?? '' }
  return null
}

// ─── public API ──────────────────────────────────────────────────────────────

export interface CssVar {
  name: string
  value: string
  comment?: string
}

/** Compute all CSS vars produced by a single token in a given section/subsection context. */
export function tokenToCssVars(
  sectionId: string,
  sub: { id: string; type: string },
  token: TokenNode,
): CssVar[] {
  if (CSS_SKIP_SECTIONS.has(sectionId)) return []
  if (CSS_SKIP_TYPES.has(sub.type))     return []
  if (token.name === 'usage' || token.name === 'prohibited') return []

  const p    = prefix(sectionId, sub.id, sub.type)
  const name  = token.name.trim()
  const value = token.value.trim()

  // type-scale: "14px / 1.6 / 400" → three separate vars
  if (sub.type === 'scale' && sectionId === 'typography') {
    const ts = parseTypeScale(value)
    if (ts) {
      const vars: CssVar[] = []
      if (ts.size)       vars.push({ name: `--text-${name}`,        value: ts.size,       comment: token.zh })
      if (ts.lineHeight) vars.push({ name: `--leading-${name}`,     value: ts.lineHeight })
      if (ts.weight)     vars.push({ name: `--font-weight-${name}`, value: ts.weight })
      return vars
    }
  }

  const varName = p ? `--${p}-${name}` : `--${name}`
  return [{ name: varName, value, comment: token.zh }]
}

/** Compute all CSS vars produced by an entire subsection. */
export function subsectionToCssVars(
  sectionId: string,
  sub: SubsectionNode,
): CssVar[] {
  if (CSS_SKIP_SECTIONS.has(sectionId)) return []
  if (CSS_SKIP_TYPES.has(sub.type))     return []

  const tokens: TokenNode[] = [
    ...sub.tokens,
    ...sub.groups.flatMap(g => g.tokens),
  ]
  return tokens.flatMap(token => tokenToCssVars(sectionId, sub, token))
}
