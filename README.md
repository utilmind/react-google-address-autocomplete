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
- optional dropdown portal rendering for dialogs/modals;
- form-fill demo that maps a selected place to address, city, state, ZIP, latitude, and longitude;
- browser-autofill-resistant defaults for address search inputs;
- selected-address TypeScript types;
- tested Google place address parser;
- browser-side Google Maps JavaScript loader;
- browser-side Google Places Autocomplete Data API provider with mocked unit tests.

The next major step is hardening edge cases: disabled/read-only behavior, touch selection, more accessibility checks, and broader real-world demo coverage.

## Work plan

See [TODO.md](./TODO.md). Keep it updated on every patch.

## Legacy reference

The old jQuery/Twitter Typeahead implementation is kept only as a reference archive at
[`jquery-legacy/geo-dropdown.js`](./jquery-legacy/geo-dropdown.js). It is intentionally excluded from Prettier formatting so the historical file stays untouched.

## Development

Use pnpm from the repository root. The root `dev` script starts the Vite demo app.

```bash
pnpm install
pnpm dev
pnpm test
pnpm typecheck
pnpm build
```

## Running the demo app

1. Copy `apps/demo/.env.example` to `apps/demo/.env`.
2. Set `VITE_GOOGLE_MAPS_API_KEY` to a browser-restricted Google Maps JavaScript API key with Places enabled.
3. Start the demo from the repository root:

```bash
pnpm dev
```

The same app can also be started explicitly with:

```bash
pnpm --filter address-autocomplete-demo dev
```
