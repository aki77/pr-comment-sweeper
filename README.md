# PR Comment Sweeper

A Chrome extension that adds bulk hide and delete actions for GitHub pull request review comments.

## Features

- **Select multiple comments** via per-comment checkboxes injected into the PR page
- **Bulk Hide** — minimizes selected comments with a reason (Outdated, Resolved, Off-topic, Duplicate, Low quality, Spam, Abuse)
- **Bulk Delete** — permanently removes selected comments (requires delete permission on each comment)
- **Floating action bar** — appears when one or more comments are selected; shows selected count, mode toggle, reason selector, and status progress
- **Up to 5 concurrent requests** for fast batch processing
- **Toast notifications** summarizing results after each batch

## Limitations

> [!IMPORTANT]
> This extension only works on the **Conversation tab** of a pull request. Comments viewed in the **Files changed tab** are not supported.

## Installation

1. Clone this repository
2. Install dependencies:
   ```sh
   pnpm install
   ```
3. Build the extension:
   ```sh
   pnpm build
   ```
4. Open `chrome://extensions`, enable **Developer mode**, click **Load unpacked**, and select the `dist` folder

## Development

```sh
pnpm dev
```

Vite will watch for changes and rebuild automatically. Reload the extension in `chrome://extensions` after each rebuild.

## Usage

1. Open any GitHub pull request
2. Checkboxes appear on each review comment
3. Check the comments you want to act on
4. The action bar appears at the bottom of the page:
   - Choose **Hide** or **Delete** mode
   - For Hide, select a reason from the dropdown
   - Click the action button to process all selected comments
5. A toast notification reports how many comments were hidden or deleted

## License

MIT
