'use client'

import type { SubsectionNode } from '@/lib/parser/types'
import ColorGroupRenderer from './renderers/ColorGroupRenderer'
import ColorScaleRenderer from './renderers/ColorScaleRenderer'
import GradientRenderer from './renderers/GradientRenderer'
import TypeScaleRenderer from './renderers/TypeScaleRenderer'
import SpacingScaleRenderer from './renderers/SpacingScaleRenderer'
import ShadowScaleRenderer from './renderers/ShadowScaleRenderer'
import BorderRadiusRenderer from './renderers/BorderRadiusRenderer'
import EasingRenderer from './renderers/EasingRenderer'
import AnimationRenderer from './renderers/AnimationRenderer'
import AIPromptRenderer from './renderers/AIPromptRenderer'
import ListRenderer from './renderers/ListRenderer'
import TextRenderer from './renderers/TextRenderer'
import RulesRenderer from './renderers/RulesRenderer'
import GenericScaleRenderer from './renderers/GenericScaleRenderer'
import ComponentSpecRenderer from './renderers/ComponentSpecRenderer'

interface Props {
  subsection: SubsectionNode
  onTokenClick?: (line: number) => void
  onTokenColorChange?: (line: number, color: string) => void
}

export default function SectionBlock({ subsection, onTokenClick, onTokenColorChange }: Props) {
  const { type, tokens, groups, rawText, title } = subsection

  const renderContent = () => {
    switch (type) {
      case 'color-group':
        return <ColorGroupRenderer tokens={tokens} onTokenClick={onTokenClick} onTokenColorChange={onTokenColorChange} />
      case 'color-scale':
        return <ColorScaleRenderer tokens={tokens} onTokenClick={onTokenClick} onTokenColorChange={onTokenColorChange} />
      case 'gradient-group':
        return <GradientRenderer tokens={tokens} onTokenClick={onTokenClick} />
      case 'scale':
        // Detect whether this is a type scale (values contain /) or spacing/other
        if (tokens[0]?.value.includes('/')) {
          return <TypeScaleRenderer tokens={tokens} onTokenClick={onTokenClick} />
        }
        if (title.toLowerCase().includes('spac') || title.toLowerCase().includes('间距')) {
          return <SpacingScaleRenderer tokens={tokens} onTokenClick={onTokenClick} />
        }
        if (title.toLowerCase().includes('radius') || title.toLowerCase().includes('圆角')) {
          return <BorderRadiusRenderer tokens={tokens} onTokenClick={onTokenClick} />
        }
        return <GenericScaleRenderer tokens={tokens} onTokenClick={onTokenClick} />
      case 'shadow-scale':
        return <ShadowScaleRenderer tokens={tokens} onTokenClick={onTokenClick} />
      case 'easing-group':
        return <EasingRenderer tokens={tokens} onTokenClick={onTokenClick} />
      case 'animation-pattern':
        return <AnimationRenderer groups={groups} tokens={tokens} onTokenClick={onTokenClick} />
      case 'ai-prompt':
        return rawText ? <AIPromptRenderer rawText={rawText} /> : null
      case 'list':
        return <ListRenderer tokens={tokens} onTokenClick={onTokenClick} />
      case 'text':
        return rawText ? <TextRenderer rawText={rawText} /> : null
      case 'rules':
        return rawText ? <RulesRenderer rawText={rawText} /> : null
      case 'font-list':
        return <GenericScaleRenderer tokens={tokens} onTokenClick={onTokenClick} />
      case 'component-spec':
        return <ComponentSpecRenderer groups={groups} tokens={tokens} rawText={rawText} onTokenClick={onTokenClick} />
      case 'layout':
      case 'breakpoints':
      case 'spec':
      default:
        if (tokens.length > 0) {
          return <GenericScaleRenderer tokens={tokens} onTokenClick={onTokenClick} />
        }
        if (rawText) return <TextRenderer rawText={rawText} />
        return null
    }
  }

  const content = renderContent()
  if (!content) return null

  return (
    <div className="mb-6">
      <h4 className="text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-3">
        {title}
      </h4>
      {content}
    </div>
  )
}
