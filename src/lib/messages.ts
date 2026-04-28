import type { ReportedContentClassifier } from '../types'

export type MinimizeRequest = {
  type: 'MINIMIZE_COMMENT'
  subjectId: string
  classifier: ReportedContentClassifier
}

export type MinimizeResponse =
  | { ok: true; isMinimized: boolean; minimizedReason: string | null }
  | { ok: false; error: string }
