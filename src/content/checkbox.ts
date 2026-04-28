import { selection } from './selection'

const INJECTED_ATTR = 'data-pcs-injected'
const CHECKBOX_CLASS = 'pcs-checkbox'

export function injectCheckbox(element: HTMLElement) {
  if (element.hasAttribute(INJECTED_ATTR)) return

  const subjectId = element.getAttribute('data-gid')
  if (!subjectId || !subjectId.startsWith('PRRC_')) return

  element.setAttribute(INJECTED_ATTR, '1')

  const computed = getComputedStyle(element)
  if (computed.position === 'static') {
    element.style.position = 'relative'
  }

  const checkbox = document.createElement('input')
  checkbox.type = 'checkbox'
  checkbox.className = CHECKBOX_CLASS
  checkbox.title = 'Select this comment for bulk hide'
  checkbox.setAttribute('aria-label', 'Select comment for bulk hide')
  checkbox.dataset['gid'] = subjectId

  checkbox.addEventListener('change', () => {
    if (checkbox.checked) {
      selection.add(subjectId)
    } else {
      selection.delete(subjectId)
    }
  })

  checkbox.addEventListener('click', (e) => e.stopPropagation())

  element.prepend(checkbox)
}

export function uncheckById(subjectId: string) {
  const selector = `.${CHECKBOX_CLASS}[data-gid="${cssEscape(subjectId)}"]`
  const checkbox = document.querySelector<HTMLInputElement>(selector)
  if (checkbox) checkbox.checked = false
}

function cssEscape(value: string): string {
  if (typeof CSS !== 'undefined' && typeof CSS.escape === 'function') {
    return CSS.escape(value)
  }
  return value.replace(/[^a-zA-Z0-9_-]/g, (c) => `\\${c}`)
}
