import type { TokenNode } from './types'

// Matches: - name: value  // zh-comment  (standard token with colon)
const TOKEN_NAMED_RE = /^-\s+([^:]+?):\s+([\s\S]*?)(?:\s+\/\/\s*(.+))?$/

// Matches: - value  // zh-comment  (list item without colon, e.g. keywords)
const TOKEN_LIST_RE = /^-\s+([^\s/][\s\S]*?)(?:\s+\/\/\s*(.+))?$/

export function parseTokenLine(raw: string, lineNumber: number): TokenNode | null {
  const trimmed = raw.trim()
  if (!trimmed.startsWith('- ')) return null

  // Try name: value format first
  const named = TOKEN_NAMED_RE.exec(trimmed)
  if (named) {
    const [, name, value, zh] = named
    const cleanName = name.trim()
    const cleanValue = value.trim()
    if (cleanName && cleanValue) {
      return { name: cleanName, value: cleanValue, zh: zh?.trim(), line: lineNumber, raw }
    }
  }

  // Fall back to plain list item: use value as both name and value
  const list = TOKEN_LIST_RE.exec(trimmed)
  if (list) {
    const [, value, zh] = list
    const cleanValue = value.trim()
    if (cleanValue) {
      return { name: cleanValue, value: cleanValue, zh: zh?.trim(), line: lineNumber, raw }
    }
  }

  return null
}

export function parseSection(comment: string): string | null {
  const m = comment.match(/<!--\s*section:\s*([a-z0-9-]+)\s*-->/)
  return m ? m[1] : null
}

export function parseType(comment: string): string | null {
  const m = comment.match(/<!--\s*type:\s*([a-z0-9-]+)\s*-->/)
  return m ? m[1] : null
}

export function parseH4Comment(line: string): { title: string; zh?: string } | null {
  const m = line.match(/^####\s+(.+?)(?:\s+\/\/\s*(.+))?$/)
  if (!m) return null
  return { title: m[1].trim(), zh: m[2]?.trim() }
}
