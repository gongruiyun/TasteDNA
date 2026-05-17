import type {
  DesignAST,
  MetaBlock,
  SectionNode,
  SubsectionNode,
  GroupNode,
  RendererType,
} from './types'
import { parseTokenLine, parseSection, parseType, parseH4Comment } from './tokenizer'

function parseFrontMatter(lines: string[]): { meta: MetaBlock; bodyStart: number } {
  if (lines[0]?.trim() !== '---') return { meta: {}, bodyStart: 0 }

  let end = -1
  for (let i = 1; i < lines.length; i++) {
    if (lines[i].trim() === '---') { end = i; break }
  }
  if (end === -1) return { meta: {}, bodyStart: 0 }

  const yamlLines = lines.slice(1, end)
  const meta: MetaBlock = {}

  // Simple YAML parser for flat meta.* keys (avoids js-yaml bundle at parse time)
  let inMeta = false
  for (const line of yamlLines) {
    if (line.trim() === 'meta:') { inMeta = true; continue }
    if (inMeta && line.match(/^\s{2}(\w+):\s*"?([^"]+)"?/)) {
      const m = line.match(/^\s{2}(\w+):\s*"?([^"]*)"?/)
      if (m) (meta as Record<string, string>)[m[1]] = m[2]
    }
  }

  return { meta, bodyStart: end + 1 }
}

export function parseDESIGNMD(markdown: string): DesignAST {
  const lines = markdown.split('\n')
  const { meta, bodyStart } = parseFrontMatter(lines)

  const sections: SectionNode[] = []
  let currentSection: SectionNode | null = null
  let currentSubsection: SubsectionNode | null = null
  let currentGroup: GroupNode | null = null
  let collectingRawText = false
  let rawTextLines: string[] = []

  const flushGroup = () => {
    if (currentGroup && currentSubsection) {
      currentSubsection.groups.push(currentGroup)
      currentGroup = null
    }
  }

  const flushRawText = () => {
    if (collectingRawText && currentSubsection) {
      currentSubsection.rawText = rawTextLines.join('\n').trim()
      rawTextLines = []
      collectingRawText = false
    }
  }

  const flushSubsection = () => {
    flushGroup()
    flushRawText()
    if (currentSubsection && currentSection) {
      currentSection.subsections.push(currentSubsection)
      currentSubsection = null
    }
  }

  const flushSection = () => {
    flushSubsection()
    if (currentSection) {
      currentSection.line.end = lines.length - 1
      sections.push(currentSection)
      currentSection = null
    }
  }

  for (let i = bodyStart; i < lines.length; i++) {
    const line = lines[i]
    const lineNum = i + 1 // 1-indexed

    // H2 section header
    if (line.match(/^##\s+[^#]/)) {
      // peek next line for <!-- section: ... -->
      const nextLine = lines[i + 1] ?? ''
      const sectionId = parseSection(nextLine)

      flushSection()

      const title = line.replace(/^##\s+/, '').trim()
      currentSection = {
        id: sectionId ?? title.toLowerCase().replace(/\s+/g, '-'),
        title,
        line: { start: lineNum, end: lineNum },
        subsections: [],
      }
      if (sectionId) i++ // skip the <!-- section --> comment line
      continue
    }

    // H3 subsection header
    if (line.match(/^###\s+[^#]/)) {
      const nextLine = lines[i + 1] ?? ''
      const typeId = parseType(nextLine)

      flushSubsection()

      const title = line.replace(/^###\s+/, '').trim()
      currentSubsection = {
        id: title.toLowerCase().replace(/\s+/g, '-'),
        title,
        type: (typeId as RendererType) ?? 'unknown',
        line: { start: lineNum, end: lineNum },
        groups: [],
        tokens: [],
      }

      if (typeId) {
        i++ // skip the <!-- type --> comment line
        // For ai-prompt and text types, collect raw text
        if (typeId === 'ai-prompt' || typeId === 'text') {
          collectingRawText = true
          rawTextLines = []
        }
      }
      continue
    }

    // H4 group header (inside animation-pattern etc.)
    if (line.match(/^####\s+/)) {
      flushGroup()
      const parsed = parseH4Comment(line)
      if (parsed && currentSubsection) {
        currentGroup = {
          id: parsed.title.toLowerCase().replace(/\s+/g, '-'),
          title: parsed.title,
          zh: parsed.zh,
          line: lineNum,
          tokens: [],
        }
      }
      continue
    }

    // Raw text collection (ai-prompt / text type)
    if (collectingRawText && currentSubsection) {
      // Stop collecting on next H2/H3/H4
      if (line.match(/^#{2,4}\s/)) {
        flushRawText()
        i-- // re-process this line
        continue
      }
      // Skip HTML comments within the block
      if (line.trim().startsWith('<!--')) continue
      rawTextLines.push(line)
      continue
    }

    // Token line: - name: value  // zh
    if (line.trim().startsWith('- ') && currentSubsection) {
      const token = parseTokenLine(line, lineNum)
      if (token) {
        if (currentGroup) {
          currentGroup.tokens.push(token)
        } else {
          currentSubsection.tokens.push(token)
        }
      }
      continue
    }

    // rules type: collect ✅ DO / ❌ DON'T lines as tokens
    if (currentSubsection?.type === 'rules' && (line.startsWith('✅') || line.startsWith('❌'))) {
      // Treat as section marker, skip
      continue
    }
  }

  flushSection()

  return { meta, sections, lines }
}

/** Get all tokens as a flat map of path → token for quick lookup */
export function flattenTokens(ast: DesignAST): Map<string, { value: string; line: number }> {
  const map = new Map<string, { value: string; line: number }>()
  for (const section of ast.sections) {
    for (const sub of section.subsections) {
      for (const token of sub.tokens) {
        map.set(`${section.id}.${sub.id}.${token.name}`, { value: token.value, line: token.line })
      }
      for (const group of sub.groups) {
        for (const token of group.tokens) {
          map.set(`${section.id}.${sub.id}.${group.id}.${token.name}`, { value: token.value, line: token.line })
        }
      }
    }
  }
  return map
}
