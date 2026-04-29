import { CHECKBOX_CLASS, INJECTED_ATTR } from './dom'
import { selection } from './selection'

export function injectCheckbox(element: HTMLElement) {
  if (element.hasAttribute(INJECTED_ATTR)) return
  const id = element.id.replace(/^discussion_r/, '')
  if (!id) return

  const minimizeForm = element.querySelector('form.js-timeline-comment-minimize, form[action$="/minimize"]')
  if (!minimizeForm) return

  const author = element.querySelector<HTMLAnchorElement>('a.author')
  const authorRow = author?.parentElement
  if (!authorRow) return

  element.setAttribute(INJECTED_ATTR, '1')

  const checkbox = document.createElement('input')
  checkbox.type = 'checkbox'
  checkbox.className = CHECKBOX_CLASS
  checkbox.title = 'Select this comment for bulk hide'
  checkbox.setAttribute('aria-label', 'Select comment for bulk hide')

  checkbox.addEventListener('change', () => {
    if (checkbox.checked) selection.add(id)
    else selection.delete(id)
  })
  checkbox.addEventListener('click', (e) => e.stopPropagation())

  selection.register(id, checkbox, element)
  authorRow.prepend(checkbox)
}
