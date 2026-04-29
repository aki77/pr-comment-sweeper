type Listener = (size: number) => void

const checkboxes = new Map<string, HTMLInputElement>()
const commentEls = new Map<string, HTMLElement>()
const items = new Set<string>()
const listeners = new Set<Listener>()

let batchDepth = 0
let pendingNotify = false

function notify() {
  if (batchDepth > 0) {
    pendingNotify = true
    return
  }
  for (const listener of listeners) listener(items.size)
}

export const selection = {
  register(id: string, checkbox: HTMLInputElement, comment: HTMLElement) {
    checkboxes.set(id, checkbox)
    commentEls.set(id, comment)
  },
  add(id: string) {
    if (items.has(id)) return
    items.add(id)
    notify()
  },
  delete(id: string) {
    if (!items.delete(id)) return
    const checkbox = checkboxes.get(id)
    if (checkbox) checkbox.checked = false
    notify()
  },
  unregister(id: string) {
    checkboxes.delete(id)
    commentEls.delete(id)
    if (items.delete(id)) notify()
  },
  clear() {
    if (items.size === 0) return
    for (const id of items) {
      const checkbox = checkboxes.get(id)
      if (checkbox) checkbox.checked = false
    }
    items.clear()
    notify()
  },
  values(): string[] {
    return [...items]
  },
  commentEl(id: string): HTMLElement | undefined {
    return commentEls.get(id)
  },
  subscribe(listener: Listener): () => void {
    listeners.add(listener)
    listener(items.size)
    return () => listeners.delete(listener)
  },
  async batch<T>(fn: () => Promise<T>): Promise<T> {
    batchDepth += 1
    try {
      return await fn()
    } finally {
      batchDepth -= 1
      if (batchDepth === 0 && pendingNotify) {
        pendingNotify = false
        notify()
      }
    }
  },
}
