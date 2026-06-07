# React Google Address Autocomplete

Standalone React/TypeScript address autocomplete component powered by Google Places Autocomplete Data API.

## Repository status

This repository is in early implementation. The current package includes:

- pnpm workspace scaffold;
- Vite demo scaffold;
- MIT license;
- headless component API draft;
- controlled input with a first-pass suggestions dropdown;
- keyboard navigation for ArrowUp, ArrowDown, Enter, Escape, and Tab;
- selected-address TypeScript types;
- tested Google place address parser;
- browser-side Google Maps JavaScript loader;
- browser-side Google Places Autocomplete Data API provider with mocked unit tests.

The next major step is hardening the component UI: portal rendering, more ARIA/a11y review, disabled/read-only edge cases, and modal behavior.

## Work plan

See [TODO.md](./TODO.md). Keep it updated on every patch.

## Legacy reference

The old jQuery/Twitter Typeahead implementation is kept only as a reference archive at
[`jquery-legacy/geo-dropdown.js`](./jquery-legacy/geo-dropdown.js). It is intentionally excluded from Prettier formatting so the historical file stays untouched.

## Development

```bash
pnpm install
pnpm dev
pnpm test
pnpm typecheck
pnpm build
```
