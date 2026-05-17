// URL-safe sharing: compress DESIGN.md content → base64 → URL param
// Uses built-in TextEncoder + CompressionStream (available in modern browsers)

export async function compressToBase64(text: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(text)
  const cs = new CompressionStream('gzip')
  const writer = cs.writable.getWriter()
  writer.write(data)
  writer.close()
  const compressed = await new Response(cs.readable).arrayBuffer()
  const bytes = new Uint8Array(compressed)
  let binary = ''
  bytes.forEach(b => binary += String.fromCharCode(b))
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '')
}

export async function decompressFromBase64(encoded: string): Promise<string> {
  const base64 = encoded.replace(/-/g, '+').replace(/_/g, '/')
  const binary = atob(base64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
  const ds = new DecompressionStream('gzip')
  const writer = ds.writable.getWriter()
  writer.write(bytes)
  writer.close()
  const text = await new Response(ds.readable).text()
  return text
}

export function buildShareUrl(content: string): Promise<string> {
  return compressToBase64(content).then(encoded => {
    const url = new URL(window.location.href)
    url.pathname = '/view'
    url.search = `?d=${encoded}`
    return url.toString()
  })
}
