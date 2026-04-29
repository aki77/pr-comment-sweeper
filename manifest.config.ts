import { defineManifest } from '@crxjs/vite-plugin'
import pkg from './package.json' with { type: 'json' }

export default defineManifest({
  manifest_version: 3,
  name: 'PR Comment Sweeper',
  version: pkg.version,
  description: 'Bulk-hide GitHub PR review comments',
  content_scripts: [
    {
      matches: [
        'https://github.com/*/*/pull/*',
      ],
      js: ['src/content/main.ts'],
      run_at: 'document_idle',
    },
  ],
  icons: {
    16: 'icons/16.png',
    32: 'icons/32.png',
    48: 'icons/48.png',
    128: 'icons/128.png',
  },
})
