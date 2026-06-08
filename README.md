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
- optional Twitter Typeahead-style highlighted suggestion preview in the input;
- optional dropdown portal rendering for dialogs/modals;
- form-fill demo that maps a selected place to address, city, state, ZIP, country, latitude, and longitude, with US-only search restrictions;
- dark themed demo dropdown styling with a Lucide-style map-pin icon, loading spinner, and themed scrollbars;
- browser-autofill-resistant defaults for address search inputs;
- optional loading row rendering, hidden by default;
- selected-address TypeScript types;
- tested Google place address parser;
- browser-side Google Maps JavaScript loader;
- browser-side Google Places Autocomplete Data API provider with explicit button-driven address lookup and mocked unit tests.

The next major step is hardening edge cases: disabled/read-only behavior, touch selection, more accessibility checks, and broader real-world demo coverage.

## Package documentation

The package-level documentation lives in [`packages/react-google-address-autocomplete/README.md`](./packages/react-google-address-autocomplete/README.md). It includes installation, minimal usage, component props, provider options, Google Cloud setup, demo instructions, selected-address shape, explicit lookup behavior, and local package testing notes.

## Work plan

See [TODO.md](./TODO.md). Keep it updated on every patch.

## Legacy reference

The old jQuery/Twitter Typeahead implementation is kept only as a reference archive at
[`jquery-legacy/geo-dropdown.js`](./jquery-legacy/geo-dropdown.js). It is intentionally excluded from Prettier formatting so the historical file stays untouched.

## Restricting suggestions

Suggestions are worldwide by default. To restrict a field to the United States, pass `countryCodes` to the component:

```tsx
<AddressAutocompleteInput countryCodes={['US']} provider={provider} value={address} onValueChange={setAddress} />
```

The package README contains the full prop reference, including request options, render props, portal dropdown options, explicit lookup behavior, and loading-state props: [`packages/react-google-address-autocomplete/README.md`](./packages/react-google-address-autocomplete/README.md).

## Development

Use pnpm from the repository root. The root `dev` script starts the Vite demo app.

```bash
pnpm install
pnpm dev
pnpm test
pnpm typecheck
pnpm build
```

On Windows, use the repository-root helper script to run the full verification flow and create a local `.tgz` package in `vendor/npm`:

```bat
build-and-pack.bat
```

ESLint is configured to lint source files only. Generated Vite/tsup outputs under nested `dist` directories, local build outputs, coverage, `.vite`, and `vendor` package artifacts are ignored.

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
