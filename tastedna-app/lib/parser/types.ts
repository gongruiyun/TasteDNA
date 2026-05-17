export type RendererType =
  | 'color-group'
  | 'color-scale'
  | 'gradient-group'
  | 'scale'
  | 'font-list'
  | 'shadow-scale'
  | 'easing-group'
  | 'animation-pattern'
  | 'layout'
  | 'breakpoints'
  | 'spec'
  | 'ai-prompt'
  | 'list'
  | 'text'
  | 'rules'
  | 'component-spec'
  | 'unknown'

export interface TokenNode {
  name: string
  value: string
  zh?: string
  line: number
  raw: string
}

export interface GroupNode {
  id: string
  title: string
  zh?: string
  line: number
  tokens: TokenNode[]
}

export interface SubsectionNode {
  id: string
  title: string
  type: RendererType
  line: { start: number; end: number }
  groups: GroupNode[]
  tokens: TokenNode[]
  /** For ai-prompt and text types: raw block text */
  rawText?: string
}

export interface SectionNode {
  id: string
  title: string
  line: { start: number; end: number }
  subsections: SubsectionNode[]
}

export interface MetaBlock {
  project?: string
  version?: string
  created?: string
  updated?: string
  language?: 'zh-CN' | 'en-US' | 'bilingual'
  description?: string
}

export interface DesignAST {
  meta: MetaBlock
  sections: SectionNode[]
  /** Raw markdown lines for editor sync */
  lines: string[]
}
