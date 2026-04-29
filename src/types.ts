export type ReportedContentClassifier =
  | 'ABUSE'
  | 'DUPLICATE'
  | 'LOW_QUALITY'
  | 'OFF_TOPIC'
  | 'OUTDATED'
  | 'RESOLVED'
  | 'SPAM'

export const CLASSIFIER_OPTIONS: { value: ReportedContentClassifier; label: string }[] = [
  { value: 'OUTDATED', label: 'Outdated' },
  { value: 'RESOLVED', label: 'Resolved' },
  { value: 'OFF_TOPIC', label: 'Off-topic' },
  { value: 'DUPLICATE', label: 'Duplicate' },
  { value: 'LOW_QUALITY', label: 'Low quality' },
  { value: 'SPAM', label: 'Spam' },
  { value: 'ABUSE', label: 'Abuse' },
]
