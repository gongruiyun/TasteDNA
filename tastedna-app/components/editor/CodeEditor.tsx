'use client'

import { useEffect, useRef, useImperativeHandle, forwardRef } from 'react'
import { basicSetup } from 'codemirror'
import { EditorView, ViewUpdate, Decoration } from '@codemirror/view'
import { EditorState, StateField, StateEffect, RangeSetBuilder } from '@codemirror/state'
import { markdown } from '@codemirror/lang-markdown'
import { oneDark } from '@codemirror/theme-one-dark'

export interface CodeEditorHandle {
  scrollToLine: (line: number) => void
  getValue: () => string
}

interface Props {
  value: string
  onChange: (value: string) => void
  highlightLine?: number
  onCursorChange?: (line: number) => void
}

const setHighlightLine = StateEffect.define<number | null>()

const highlightLineField = StateField.define({
  create: () => Decoration.none,
  update(decorations, tr) {
    decorations = decorations.map(tr.changes)
    for (const e of tr.effects) {
      if (e.is(setHighlightLine)) {
        if (e.value === null) {
          decorations = Decoration.none
        } else {
          const builder = new RangeSetBuilder<Decoration>()
          try {
            const line = tr.state.doc.line(e.value)
            builder.add(line.from, line.from, Decoration.line({ class: 'cm-highlighted-line' }))
          } catch { /* line out of range */ }
          decorations = builder.finish()
        }
      }
    }
    return decorations
  },
  provide: f => EditorView.decorations.from(f),
})

const editorTheme = EditorView.theme({
  '&': { height: '100%', fontSize: '13px', fontFamily: '"JetBrains Mono", "Fira Code", monospace' },
  '.cm-scroller': { overflow: 'auto', height: '100%' },
  '.cm-content': { padding: '16px 0', minHeight: '100%' },
  '.cm-line': { padding: '0 16px' },
  '.cm-highlighted-line': {
    backgroundColor: 'rgba(79, 110, 247, 0.15)',
    borderLeft: '2px solid #4F6EF7',
    paddingLeft: '14px !important',
  },
  '.cm-gutters': { backgroundColor: '#282c34', border: 'none', paddingRight: '4px' },
})

const CodeEditor = forwardRef<CodeEditorHandle, Props>(({ value, onChange, highlightLine, onCursorChange }, ref) => {
  const onCursorChangeRef = useRef(onCursorChange)
  onCursorChangeRef.current = onCursorChange
  const containerRef = useRef<HTMLDivElement>(null)
  const viewRef = useRef<EditorView | null>(null)

  useImperativeHandle(ref, () => ({
    scrollToLine(line: number) {
      const view = viewRef.current
      if (!view) return
      try {
        const docLine = view.state.doc.line(line)
        view.dispatch({
          selection: { anchor: docLine.from },
          effects: [
            setHighlightLine.of(line),
            EditorView.scrollIntoView(docLine.from, { y: 'center' }),
          ],
        })
      } catch { /* line out of range */ }
    },
    getValue() {
      return viewRef.current?.state.doc.toString() ?? ''
    },
  }))

  useEffect(() => {
    if (!containerRef.current) return
    const view = new EditorView({
      state: EditorState.create({
        doc: value,
        extensions: [
          basicSetup,
          markdown(),
          oneDark,
          editorTheme,
          highlightLineField,
          EditorView.lineWrapping,
          EditorView.updateListener.of((update: ViewUpdate) => {
            if (update.docChanged) onChange(update.state.doc.toString())
            if (update.selectionSet) {
              const line = update.state.doc.lineAt(update.state.selection.main.head).number
              onCursorChangeRef.current?.(line)
            }
          }),
        ],
      }),
      parent: containerRef.current,
    })
    viewRef.current = view
    return () => view.destroy()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    const view = viewRef.current
    if (!view) return
    const current = view.state.doc.toString()
    if (current !== value) {
      view.dispatch({ changes: { from: 0, to: current.length, insert: value } })
    }
  }, [value])

  useEffect(() => {
    viewRef.current?.dispatch({ effects: setHighlightLine.of(highlightLine ?? null) })
  }, [highlightLine])

  return <div ref={containerRef} className="h-full w-full" />
})

CodeEditor.displayName = 'CodeEditor'
export default CodeEditor
