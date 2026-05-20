export async function POST(request: Request) {
  const { url } = await request.json()
  if (!url?.trim()) return new Response('Missing url', { status: 400 })

  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; TasteDNA/1.0)' },
      signal: AbortSignal.timeout(8000),
    })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const html = await res.text()

    // Extract inline <style> blocks + <link> stylesheets (inline only)
    const styleBlocks: string[] = []
    const styleRe = /<style[^>]*>([\s\S]*?)<\/style>/gi
    let m: RegExpExecArray | null
    while ((m = styleRe.exec(html)) !== null) styleBlocks.push(m[1])

    const combined = styleBlocks.join('\n')

    // Extract hex / rgb / hsl colors
    const colorRe = /(#[0-9a-fA-F]{3,8}|rgba?\([^)]+\)|hsla?\([^)]+\))/g
    const colors = [...new Set([...combined.matchAll(colorRe)].map(x => x[1]))].slice(0, 60)

    // Extract font-family values
    const fontRe = /font-family\s*:\s*([^;}{]+)/gi
    const fonts = [...new Set([...combined.matchAll(fontRe)].map(x => x[1].trim()))].slice(0, 10)

    // Extract CSS custom properties (--var: value)
    const varRe = /--([\w-]+)\s*:\s*([^;}{]+)/g
    const cssVars: Record<string, string> = {}
    let v: RegExpExecArray | null
    while ((v = varRe.exec(combined)) !== null) {
      cssVars[v[1]] = v[2].trim()
    }

    // Extract page title + meta description
    const titleM = html.match(/<title[^>]*>([^<]+)<\/title>/i)
    const descM = html.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)/i)

    return Response.json({
      url,
      title: titleM?.[1]?.trim() ?? '',
      description: descM?.[1]?.trim() ?? '',
      colors,
      fonts,
      cssVars,
    })
  } catch (e: unknown) {
    return Response.json({ error: (e as Error).message }, { status: 500 })
  }
}
