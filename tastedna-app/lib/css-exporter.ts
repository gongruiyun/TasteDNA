import type { DesignAST, SubsectionNode, TokenNode } from './parser/types'

// ─── naming helpers ─────────────────────────────────────────────────────────

/**
 * Map section + sub-type → CSS variable prefix
 *
 * Convention:
 *   colors       → --color-{name}
 *   font-list    → --font-{name}
 *   type-scale   → --text-{name}, --leading-{name}, --font-weight-{name}
 *   spacing      → --space-{name}
 *   layout       → --{name}  (already descriptive: sidebar-width, topbar-height)
 *   breakpoints  → --screen-{name}
 *   radius       → --radius-{name}
 *   border-width → --border-{name}
 *   shadows      → --shadow-{name}
 *   easing       → --ease-{name}
 *   duration     → --duration-{name}
 */
function prefix(sectionId: string, subId: string, type: string): string {
  if (sectionId === 'colors')      return 'color'
  if (sectionId === 'typography') {
    if (type === 'font-list')       return 'font'
    return '' // type-scale handled separately
  }
  if (sectionId === 'spacing') {
    if (subId === 'layout')         return ''       // sidebar-width etc. already specific
    if (subId === 'breakpoints')    return 'screen'
    return 'space'
  }
  if (sectionId === 'borders') {
    if (subId === 'radius' || subId.includes('radius')) return 'radius'
    return 'border'
  }
  if (sectionId === 'radius')       return 'radius' // some files put radius at top level
  if (sectionId === 'shadows')      return 'shadow'
  if (sectionId === 'motion') {
    if (type === 'easing-group')    return 'ease'
    if (type === 'scale')           return 'duration'
    return 'motion'
  }
  return sectionId.replace(/[^a-z0-9]/g, '-')
}

/**
 * Parse type-scale multi-value "14px / 1.6 / 400"
 * Returns separate font-size, line-height, font-weight
 */
function parseTypeScale(value: string) {
  const parts = value.split('/').map(p => p.trim())
  if (parts.length >= 2) {
    return {
      size:       parts[0] ?? '',
      lineHeight: parts[1] ?? '',
      weight:     parts[2] ?? '',
    }
  }
  // "14px/1.5" shorthand (no spaces around slash)
  const m = value.match(/^([^\s/]+)\s*\/\s*([^\s/]+)(?:\s*\/\s*([^\s/]+))?$/)
  if (m) return { size: m[1], lineHeight: m[2], weight: m[3] ?? '' }
  return null
}

// Sanitise a comment string for single-line CSS
function cssComment(zh: string | undefined): string {
  if (!zh) return ''
  return `  /* ${zh.replace(/\*\//g, '*\/')} */`
}

// ─── section skip list ───────────────────────────────────────────────────────

const SKIP_SECTIONS = new Set([
  'components',
  'illustration-style',
  'icon-style',
  'ai-context',
  'design-language',
  'brand',
])

const SKIP_TYPES = new Set([
  'animation-pattern', // too complex for a CSS var
  'text',
  'ai-prompt',
  'rules',
  'list',
  'spec',
  'component-spec',
])

// ─── main export ─────────────────────────────────────────────────────────────

export function exportToCSS(ast: DesignAST): string {
  const project = ast.meta.project ?? 'My Design System'
  const today   = new Date().toISOString().slice(0, 10)

  const out: string[] = [
    `/* ================================================`,
    ` * ${project} — Design Tokens (CSS Custom Properties)`,
    ` * Generated from DESIGN.md on ${today}`,
    ` * DO NOT EDIT — update DESIGN.md and regenerate`,
    ` * ================================================ */`,
    ``,
    `:root {`,
  ]

  for (const section of ast.sections) {
    if (SKIP_SECTIONS.has(section.id)) continue

    let sectionPrinted = false

    for (const sub of section.subsections) {
      if (SKIP_TYPES.has(sub.type)) continue

      // Collect all tokens (loose + from H4 groups)
      const tokens: TokenNode[] = [
        ...sub.tokens,
        ...sub.groups.flatMap(g => g.tokens),
      ]
      if (!tokens.length) continue

      if (!sectionPrinted) {
        out.push(``)
        out.push(`  /* ── ${section.title} ─────────────────────────────── */`)
        sectionPrinted = true
      }
      out.push(`  /* ${sub.title} */`)

      const p = prefix(section.id, sub.id, sub.type)

      for (const token of tokens) {
        // Skip behavioural meta-tokens
        if (token.name === 'usage' || token.name === 'prohibited') continue

        const name  = token.name.trim()
        const value = token.value.trim()

        // ── type-scale: "14px / 1.6 / 400" → three vars ──
        if (sub.type === 'scale' && section.id === 'typography') {
          const ts = parseTypeScale(value)
          if (ts) {
            if (ts.size)       out.push(`  --text-${name}: ${ts.size};${cssComment(token.zh)}`)
            if (ts.lineHeight) out.push(`  --leading-${name}: ${ts.lineHeight};`)
            if (ts.weight)     out.push(`  --font-weight-${name}: ${ts.weight};`)
            continue
          }
        }

        // ── layout & breakpoints: no extra prefix ──
        const varName = p ? `--${p}-${name}` : `--${name}`
        out.push(`  ${varName}: ${value};${cssComment(token.zh)}`)
      }
    }
  }

  out.push(`}`)
  out.push(``)

  // ── Tailwind v4 @theme block (bonus) ──
  out.push(`/* ── Tailwind v4 @theme (optional) ────────────────── */`)
  out.push(`/*`)
  out.push(` * Paste the :root block above into your globals.css,`)
  out.push(` * or use the @theme block below for Tailwind v4:`)
  out.push(` *`)
  out.push(` * @theme {`)
  out.push(` *   --color-primary: var(--color-primary);`)
  out.push(` *   /* … mirror the vars you need in Tailwind utilities … */`)
  out.push(` * }`)
  out.push(` */`)
  out.push(``)

  return out.join('\n')
}
