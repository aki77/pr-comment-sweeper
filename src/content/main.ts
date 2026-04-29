import { mountActionBar } from './action-bar'
import { injectCheckbox } from './checkbox'
import { COMMENT_SELECTOR } from './dom'
import './styles.css'

function injectIn(root: ParentNode) {
  if (root instanceof HTMLElement && root.matches(COMMENT_SELECTOR)) {
    injectCheckbox(root)
  }
  for (const el of root.querySelectorAll<HTMLElement>(COMMENT_SELECTOR)) {
    injectCheckbox(el)
  }
}

function start() {
  mountActionBar()
  injectIn(document)

  const pending = new Set<HTMLElement>()
  let scheduled = false
  const flush = () => {
    scheduled = false
    for (const node of pending) injectIn(node)
    pending.clear()
  }

  const observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      for (const node of mutation.addedNodes) {
        if (node instanceof HTMLElement) pending.add(node)
      }
    }
    if (pending.size > 0 && !scheduled) {
      scheduled = true
      requestAnimationFrame(flush)
    }
  })

  observer.observe(document.body, { childList: true, subtree: true })
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', start, { once: true })
} else {
  start()
}
