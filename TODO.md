# TODO: React Google Address Autocomplete

This is the living implementation plan for the component repository. Update it on every meaningful patch.

## 0. Repository foundation

- [x] Create a standalone pnpm workspace.
- [x] Add root Prettier settings matching the machine shop Next.js project.
- [x] Add root TypeScript, ESLint, Git ignore, VS Code, and CI config.
- [x] Add the component package workspace.
- [x] Add the demo app workspace.
- [x] Add an initial placeholder React component and a smoke unit test.
- [ ] Run `pnpm install` and commit the generated `pnpm-lock.yaml`.
- [ ] Decide final npm package name.
- [ ] Decide license before npm publication.

## 1. Public API design

- [ ] Finalize the component prop names.
- [ ] Decide whether the package should be mostly headless or include default styles.
- [ ] Define the normalized selected-address result shape.
- [ ] Define error states and retry behavior.
- [ ] Define controlled value behavior for manual typing versus selected place data.
- [ ] Decide whether `onAddressSelect` should fire only on dropdown selection or also on exact free-text geocode fallback.
- [ ] Decide which Google request options should be exposed directly.
- [ ] Decide whether the package should support a server-side proxy provider in addition to browser-side Google Maps JS.

## 2. Google Places provider

- [ ] Add a small Google Maps JS loader.
- [ ] Load the `places` library with `google.maps.importLibrary('places')`.
- [ ] Implement an Autocomplete Data API provider.
- [ ] Create and reuse one `AutocompleteSessionToken` per user autocomplete session.
- [ ] Reset the session token after a place is selected.
- [ ] Support query debounce.
- [ ] Protect against out-of-order async responses.
- [ ] Support country restrictions, language, region, and location bias/restriction.
- [ ] Add provider-level unit tests with mocked Google globals.

## 3. Address parsing

- [ ] Implement `parseGooglePlaceAddress()`.
- [ ] Map Google address components to `addressLine1`, `addressLine2`, `city`, `state`, `stateCode`, `postalCode`, `country`, and `countryCode`.
- [ ] Extract latitude and longitude from selected place details.
- [ ] Add unit tests for US addresses.
- [ ] Add unit tests for addresses without street number.
- [ ] Add unit tests for ZIP+4 and missing postal code cases.
- [ ] Add unit tests for non-US addresses.

## 4. React component behavior

- [ ] Implement suggestion dropdown.
- [ ] Render dropdown through a portal option for dialogs/modals.
- [ ] Add keyboard navigation: ArrowUp, ArrowDown, Enter, Escape, Tab.
- [ ] Add mouse and touch selection.
- [ ] Add loading, empty, and error states.
- [ ] Add disabled and read-only states.
- [ ] Add minimum query length.
- [ ] Add max suggestions limit.
- [ ] Add highlighted matched text rendering.
- [ ] Keep the component accessible with labels, ARIA combobox/listbox semantics, and active descendant behavior.

## 5. Styling

- [ ] Decide default CSS strategy.
- [ ] Expose class names or slot render props for input, list, item, loading, empty, and error states.
- [ ] Add a dark-mode-friendly default stylesheet if default styles are included.
- [ ] Verify dropdown z-index behavior inside dialogs.
- [ ] Verify narrow/mobile layout.

## 6. Demo app

- [ ] Add `.env` support for a browser Google Maps API key.
- [ ] Add a basic demo page.
- [ ] Add country restriction examples.
- [ ] Add a form-fill example that populates address, city, state, ZIP, latitude, and longitude.
- [ ] Add an example inside a modal/dialog.
- [ ] Add error-state and empty-state examples.
- [ ] Add README instructions for enabling Google Places API.

## 7. Testing

- [x] Add an initial smoke unit test for the placeholder component.
- [ ] Add parser unit tests.
- [ ] Add provider tests with mocked Google APIs.
- [ ] Add component interaction tests with Testing Library.
- [ ] Add keyboard navigation tests.
- [ ] Add accessibility checks.
- [ ] Add demo smoke build in CI.

## 8. Documentation

- [ ] Document installation.
- [ ] Document minimal usage.
- [ ] Document API key and Google Cloud setup.
- [ ] Document session token behavior.
- [ ] Document billing-related caveats.
- [ ] Document Next.js usage.
- [ ] Document Vite usage.
- [ ] Document styling customization.
- [ ] Document address result shape.
- [ ] Document known limitations.

## 9. Release and npm publication

- [ ] Confirm package name availability.
- [ ] Add `CHANGELOG.md`.
- [ ] Add release script.
- [ ] Add npm provenance if desired.
- [ ] Publish `0.1.0-alpha.0`.
- [ ] Test install from npm in the machine shop Next.js project.
- [ ] Publish `1.0.0` after API stabilization.

## Open decisions

- Package name: `react-google-address-autocomplete` is used as a temporary name.
- License: not selected yet.
- Default implementation direction: custom React UI powered by Google Places Autocomplete Data API.
- Default country restriction: not selected yet.
- Styling model: not selected yet.
- Server proxy support: not selected yet.
