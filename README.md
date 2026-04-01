# x-articles

Paste a public X post or article URL and get clean, agent-ready markdown in one click.

## Why

Copying bookmarked X posts and long-form articles into an agent workflow is too manual.
`x-articles` starts as a tiny web app that:

- accepts a public URL
- extracts the readable content server-side
- returns markdown, plain text, and JSON
- keeps the output easy to copy into Codex, Claude, ChatGPT, or any other agent

## Stack

- Next.js App Router
- TypeScript
- Tailwind CSS v4
- shadcn/ui
- Mozilla Readability
- JSDOM
- Turndown

## Local Development

```bash
pnpm install
pnpm dev
```

Then open [http://localhost:3000](http://localhost:3000).

## Current Scope

- public web article extraction
- public X post extraction
- one-click copy for markdown, text, or JSON
- MIT licensed

## Next Likely Steps

- improve X-specific extraction coverage
- add bookmarklet / browser extension flow
- add a CLI so agents can fetch links directly

## License

[MIT](./LICENSE)
