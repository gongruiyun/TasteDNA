/**
 * Generate class-based CSS from a component-spec subsection.
 *
 * Handles two token formats used in DESIGN.md:
 *
 * Format A — top-level compound tokens (sample.design.md):
 *   - height: sm=28px, md=36px, lg=44px
 *   - primary: bg=primary, text=white
 *
 * Format B — H4 group tokens (templates):
 *   #### 尺寸
 *   - sm: height 28px, padding 0 12px
 *   #### 变体
 *   - primary: 主要按钮   ← description only, no CSS
 *   #### 状态
 *   - disabled: opacity 0.4, cursor not-allowed
 */

import type { GroupNode, TokenNode } from './parser/types'

// ─── CSS property name map ────────────────────────────────────────────────────

const PROP: Record<string, string> = {
  height: 'height', width: 'width',
  'min-width': 'min-width', 'max-width': 'max-width',
  radius: 'border-radius', 'border-radius': 'border-radius',
  border: 'border', transition: 'transition',
  bg: 'background-color', background: 'background-color',
  color: 'color', text: 'color',
  shadow: 'box-shadow', 'box-shadow': 'box-shadow',
  opacity: 'opacity', gap: 'gap',
  padding: 'padding', margin: 'margin',
  'font-size': 'font-size', 'font-weight': 'font-weight',
  'line-height': 'line-height', display: 'display',
  cursor: 'cursor', transform: 'transform',
  'item-height': 'height', 'item-padding': 'padding',
  'item-radius': 'border-radius', 'focus-shadow': 'box-shadow',
}

// Tokens that carry no CSS value
const SKIP_KEYS = new Set([
  'usage', 'prohibited', 'variants', 'font', 'placeholder',
  'item-default', 'item-hover', 'item-active',
])

const SIZE_ORDER = ['xs', 'sm', 'md', 'lg', 'xl', '2xl', 'small', 'default', 'large']

// ─── class prefix helpers ─────────────────────────────────────────────────────

const PREFIX_ALIASES: Record<string, string> = {
  // English
  button: 'btn', input: 'input', card: 'card',
  badge: 'badge', tag: 'tag', avatar: 'avatar',
  select: 'select', modal: 'modal', tooltip: 'tooltip',
  checkbox: 'checkbox', radio: 'radio', switch: 'switch',
  'sidebar-nav': 'sidebar-nav', nav: 'nav',
  'tag / badge': 'tag', 'form controls': 'form-control',
  // Chinese
  按钮: 'btn', 输入框: 'input', 卡片: 'card',
  标签: 'tag', 微标与标签: 'tag', 徽标与标签: 'badge', 徽标: 'badge',
  头像: 'avatar', 复选框: 'checkbox', 单选框: 'radio',
  选择器: 'select', 下拉: 'select', 模态框: 'modal',
  弹窗: 'modal', 提示: 'tooltip', 开关: 'switch',
  侧边导航: 'sidebar-nav', 导航: 'nav', 表单控件: 'form-control',
}

function classPrefix(title: string): string {
  const lower = title.toLowerCase().trim()
  if (PREFIX_ALIASES[lower]) return PREFIX_ALIASES[lower]
  // Try partial match (e.g. "按钮 / Button")
  for (const [key, val] of Object.entries(PREFIX_ALIASES)) {
    if (lower.includes(key)) return val
  }
  return lower.replace(/\s*\/\s*/g, '-').replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
}

// ─── value parsing helpers ────────────────────────────────────────────────────

const TW: Record<string, number> = {
  '0': 0, '0.5': 2, '1': 4, '1.5': 6, '2': 8, '2.5': 10,
  '3': 12, '3.5': 14, '4': 16, '5': 20, '6': 24,
  '7': 28, '8': 32, '9': 36, '10': 40, '12': 48, '16': 64,
}

function resolveTailwind(val: string): string {
  const px = val.match(/^px-(\S+)$/)
  if (px && TW[px[1]] !== undefined) return `0 ${TW[px[1]]}px`
  const py = val.match(/^py-(\S+)$/)
  if (py && TW[py[1]] !== undefined) return `${TW[py[1]]}px 0`
  const p = val.match(/^p-(\S+)$/)
  if (p && TW[p[1]] !== undefined) return `${TW[p[1]]}px`
  return val
}

function resolveColor(val: string): string {
  if (val.startsWith('#')) return val
  if (val === 'white') return '#fff'
  if (val === 'black') return '#000'
  if (/^(transparent|inherit|currentColor|none)$/.test(val)) return val
  if (/^[a-z][a-z0-9-]*$/.test(val)) return `var(--color-${val})`
  return val
}

function resolveValue(propAlias: string, raw: string): string {
  // Extract value from "md (8px)" form
  const parenMatch = raw.match(/\(([^)]+)\)/)
  const val = (parenMatch ? parenMatch[1] : raw).trim()
  if (propAlias === 'padding' || propAlias === 'item-padding') return resolveTailwind(val)
  if (['bg', 'background', 'text', 'color'].includes(propAlias)) return resolveColor(val)
  return val
}

/**
 * Parse "height 28px, padding 0 12px" or "opacity 0.4，cursor not-allowed"
 * into [{prop, val}, ...]. Handles both English and Chinese commas.
 * Skips parts that contain Chinese characters (descriptive text).
 */
function parseSpaceDecls(value: string): Array<{ prop: string; val: string }> {
  const result: Array<{ prop: string; val: string }> = []
  for (const part of value.split(/[,，]\s*/)) {
    const trimmed = part.trim()
    // Skip parts with Chinese characters — they're descriptions, not CSS
    if (/[一-鿿]/.test(trimmed)) continue
    const m = trimmed.match(/^([a-z-]+)\s+(.+)$/)
    if (m) result.push({ prop: m[1], val: m[2].trim() })
  }
  return result
}

/** True if the value string looks like CSS declarations (has property names / units / keywords) */
function looksLikeCss(value: string): boolean {
  // Strip Chinese characters first — if only Chinese remains, it's a description
  const ascii = value.replace(/[一-鿿]/g, '').trim()
  if (!ascii) return false
  return /\b(height|width|padding|margin|border|font|opacity|display|gap|radius|transition|transform|shadow|cursor|background|color|flex|grid)\b/.test(ascii)
    || /\b\d+(\.\d+)?(px|rem|em|%|vh|vw)\b/.test(ascii)
    || /\b(auto|none|inherit|transparent|not-allowed|pointer|scale|rgba?)\b/.test(ascii)
}

/** Group title classification */
function groupKind(title: string): 'size' | 'variant' | 'state' | 'other' {
  const t = title.toLowerCase()
  if (/尺寸|size|大小|规格/.test(t)) return 'size'
  if (/变体|variant|样式|type|类型/.test(t)) return 'variant'
  if (/状态|state/.test(t)) return 'state'
  return 'other'
}

// ─── parse compound Format-A values ─────────────────────────────────────────

/** "sm=28px, md=36px" → { sm: "28px", md: "36px" } — handles both comma types */
function parseCompound(value: string): Record<string, string> | null {
  if (!value.includes('=')) return null
  const clean = value.split(/[,，]?\s*hover\s*:/)[0]
  const result: Record<string, string> = {}
  for (const part of clean.split(/[,，]\s*/)) {
    const eq = part.indexOf('=')
    if (eq > 0) result[part.slice(0, eq).trim()] = part.slice(eq + 1).trim()
  }
  return Object.keys(result).length >= 1 ? result : null
}

// ─── main export ─────────────────────────────────────────────────────────────

export interface ComponentCssResult {
  css: string
  hasContent: boolean
}

export function componentSubsectionToCSS(
  title: string,
  tokens: TokenNode[],
  groups: GroupNode[],
): ComponentCssResult {
  const prefix = classPrefix(title)
  const lines: string[] = [`/* ${title} */`]

  const baseDecls: string[] = []
  // size → ["height: 28px", "padding: 0 12px", ...]
  const sizeVars: Record<string, string[]> = {}
  // variant/state name → ["background-color: ...", ...]
  const themeVars: Record<string, string[]> = {}

  // ── Format A: top-level compound tokens ──────────────────────────────────
  for (const token of tokens) {
    if (SKIP_KEYS.has(token.name)) continue

    const cssProp = PROP[token.name]
    const compound = parseCompound(token.value)

    // Size compound: "height: sm=28px, md=36px, lg=44px"
    if (cssProp && compound) {
      const sizeKeys = Object.keys(compound).filter(k => SIZE_ORDER.includes(k))
      if (sizeKeys.length > 0) {
        for (const size of sizeKeys) {
          const resolved = resolveValue(token.name, compound[size])
          ;(sizeVars[size] ??= []).push(`${cssProp}: ${resolved}`)
        }
        continue
      }
    }

    // Theme/color variant: "primary: bg=primary, text=white"
    if (!cssProp && compound) {
      const decls: string[] = []
      if (compound['bg'])   decls.push(`background-color: ${resolveColor(compound['bg'])}`)
      if (compound['text']) decls.push(`color: ${resolveColor(compound['text'])}`)
      for (const [k, v] of Object.entries(compound)) {
        if (k === 'bg' || k === 'text') continue
        const p = PROP[k]; if (p) decls.push(`${p}: ${resolveValue(k, v)}`)
      }
      if (decls.length > 0) themeVars[token.name] = decls
      continue
    }

    // Base declaration
    if (cssProp) {
      const val = resolveValue(token.name, token.value)
      if (!val.includes('=') && !val.includes('→')) baseDecls.push(`${cssProp}: ${val}`)
    }
  }

  // ── Format B: H4 group tokens ─────────────────────────────────────────────
  for (const group of groups) {
    const kind = groupKind(group.title || group.id)

    for (const token of group.tokens) {
      if (SKIP_KEYS.has(token.name)) continue

      if (kind === 'size') {
        // token.name = "sm", token.value = "height 28px, padding 0 12px"
        const decls = parseSpaceDecls(token.value)
        const cssDecls: string[] = []
        for (const { prop, val } of decls) {
          const p = PROP[prop] ?? (prop.match(/^[a-z-]+$/) ? prop : null)
          if (p) cssDecls.push(`${p}: ${val}`)
        }
        if (cssDecls.length > 0) {
          const size = token.name.toLowerCase()
          ;(sizeVars[size] ??= []).push(...cssDecls)
        }

      } else if (kind === 'state') {
        // token.name = "disabled", token.value = "opacity 0.4, cursor not-allowed"
        if (!looksLikeCss(token.value)) continue
        const decls = parseSpaceDecls(token.value)
        const cssDecls: string[] = []
        for (const { prop, val } of decls) {
          const p = PROP[prop] ?? (prop.match(/^[a-z-]+$/) ? prop : null)
          if (p) cssDecls.push(`${p}: ${val}`)
        }
        if (cssDecls.length > 0) themeVars[token.name] = cssDecls

      } else if (kind === 'variant') {
        // Variant values are usually descriptions (e.g. "主要按钮") — skip CSS
        // But if value looks like CSS, parse it
        if (!looksLikeCss(token.value)) continue
        const decls = parseSpaceDecls(token.value)
        const cssDecls: string[] = []
        for (const { prop, val } of decls) {
          const p = PROP[prop] ?? (prop.match(/^[a-z-]+$/) ? prop : null)
          if (p) cssDecls.push(`${p}: ${val}`)
        }
        if (cssDecls.length > 0) themeVars[token.name] = cssDecls

      } else {
        // 'other' — try as size if name is a size key, else as a base decl set
        if (SIZE_ORDER.includes(token.name) && looksLikeCss(token.value)) {
          const decls = parseSpaceDecls(token.value)
          const cssDecls: string[] = []
          for (const { prop, val } of decls) {
            const p = PROP[prop]; if (p) cssDecls.push(`${p}: ${val}`)
          }
          if (cssDecls.length > 0) (sizeVars[token.name] ??= []).push(...cssDecls)
        }
      }
    }
  }

  // ── Emit CSS ──────────────────────────────────────────────────────────────

  if (baseDecls.length > 0) {
    lines.push(`.${prefix} {`)
    baseDecls.forEach(d => lines.push(`  ${d};`))
    lines.push(`}`)
  }

  // Size variants — fixed order
  for (const size of SIZE_ORDER) {
    const decls = sizeVars[size]
    if (!decls) continue
    if (decls.length === 1) {
      lines.push(`.${prefix}-${size} { ${decls[0]}; }`)
    } else {
      lines.push(`.${prefix}-${size} {`)
      decls.forEach(d => lines.push(`  ${d};`))
      lines.push(`}`)
    }
  }

  // Remaining size keys not in SIZE_ORDER
  for (const [size, decls] of Object.entries(sizeVars)) {
    if (SIZE_ORDER.includes(size)) continue
    if (decls.length === 1) lines.push(`.${prefix}-${size} { ${decls[0]}; }`)
    else {
      lines.push(`.${prefix}-${size} {`)
      decls.forEach(d => lines.push(`  ${d};`))
      lines.push(`}`)
    }
  }

  // Theme/state variant classes
  for (const [variant, decls] of Object.entries(themeVars)) {
    if (decls.length === 1) lines.push(`.${prefix}-${variant} { ${decls[0]}; }`)
    else {
      lines.push(`.${prefix}-${variant} {`)
      decls.forEach(d => lines.push(`  ${d};`))
      lines.push(`}`)
    }
  }

  const hasContent = baseDecls.length > 0 ||
    Object.keys(sizeVars).length > 0 ||
    Object.keys(themeVars).length > 0

  return { css: lines.join('\n'), hasContent }
}
