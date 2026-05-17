'use client'

interface Props {
  rawText: string
}

export default function TextRenderer({ rawText }: Props) {
  return (
    <p className="text-sm text-neutral-600 leading-relaxed whitespace-pre-wrap">
      {rawText}
    </p>
  )
}
