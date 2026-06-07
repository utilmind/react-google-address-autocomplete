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
- tested Google place address parser;
- browser-side Google Maps JavaScript loader;
- browser-side Google Places Autocomplete Data API provider with mocked unit tests.

The next major step is connecting the provider to the React component and implementing dropdown behavior.

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
