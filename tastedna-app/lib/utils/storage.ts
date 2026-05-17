const STORAGE_KEY = 'tastedna:design-md'

export function saveDesignMD(content: string): void {
  try {
    localStorage.setItem(STORAGE_KEY, content)
  } catch {
    // Storage quota exceeded — silently ignore
  }
}

export function loadDesignMD(): string | null {
  try {
    return localStorage.getItem(STORAGE_KEY)
  } catch {
    return null
  }
}

export function clearDesignMD(): void {
  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch {
    // ignore
  }
}
