import { mountActionBar } from './action-bar'
import { injectCheckbox } from './checkbox'
import './styles.css'

const SELECTOR = '[data-gid^="PRRC_"]'

function scanAll(root: ParentNode) {
  const elements = root.querySelectorAll<HTMLElement>(SELECTOR)
  for (const el of elements) injectCheckbox(el)
}

function processNode(node: Node) {
  if (node.nodeType !== Node.ELEMENT_NODE) return
  const el = node as HTMLElement
  if (el.matches(SELECTOR)) {
    injectCheckbox(el)
  }
  scanAll(el)
}

function start() {
  mountActionBar()
  scanAll(document)

  const observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      for (const node of mutation.addedNodes) processNode(node)
    }
  })

  observer.observe(document.body, { childList: true, subtree: true })
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', start, { once: true })
} else {
  start()
}
