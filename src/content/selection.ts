type Listener = (size: number) => void

const items = new Set<string>()
const listeners = new Set<Listener>()

function notify() {
  for (const listener of listeners) listener(items.size)
}

export const selection = {
  add(id: string) {
    if (items.has(id)) return
    items.add(id)
    notify()
  },
  delete(id: string) {
    if (!items.has(id)) return
    items.delete(id)
    notify()
  },
  clear() {
    if (items.size === 0) return
    items.clear()
    notify()
  },
  has(id: string) {
    return items.has(id)
  },
  size() {
    return items.size
  },
  values(): string[] {
    return [...items]
  },
  subscribe(listener: Listener): () => void {
    listeners.add(listener)
    listener(items.size)
    return () => listeners.delete(listener)
  },
}
