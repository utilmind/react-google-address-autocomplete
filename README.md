# React Google Address Autocomplete

Standalone React/TypeScript address autocomplete component powered by Google Places Autocomplete Data API.

## Repository status

This repository is in early implementation. The current package includes:

- pnpm workspace scaffold;
- Vite demo scaffold;
- MIT license;
- headless component API draft;
- controlled input placeholder;
- selected-address TypeScript types;
- tested Google place address parser.

The next major step is the browser-side Google Places provider.

## Work plan

See [TODO.md](./TODO.md). Keep it updated on every patch.

## Development

```bash
pnpm install
pnpm dev
pnpm test
pnpm typecheck
pnpm build
```

`pnpm-lock.yaml` is intentionally not committed yet because dependencies have not been installed in this scaffold patch.
