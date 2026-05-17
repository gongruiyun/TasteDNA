'use client'

import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels'

interface Props {
  left: React.ReactNode
  right: React.ReactNode
}

export default function EditorLayout({ left, right }: Props) {
  return (
    <PanelGroup direction="horizontal" className="h-full">
      <Panel defaultSize={43} minSize={20} maxSize={70}>
        <div className="h-full flex flex-col border-r border-neutral-200 bg-[#282c34]">
          {left}
        </div>
      </Panel>

      <PanelResizeHandle className="w-1 bg-neutral-200 hover:bg-indigo-300 transition-colors cursor-col-resize relative group">
        <div className="absolute inset-y-0 -left-1 -right-1 group-hover:bg-indigo-200/20" />
      </PanelResizeHandle>

      <Panel defaultSize={57} minSize={30}>
        <div className="h-full flex flex-col bg-white">
          {right}
        </div>
      </Panel>
    </PanelGroup>
  )
}
