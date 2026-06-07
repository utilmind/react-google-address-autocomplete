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
- [x] Decide initial npm package name: `react-google-address-autocomplete`.
- [x] Decide license before npm publication: MIT.

## 1. Public API design

- [x] Select the initial package direction: headless React component with class names and render props.
- [x] Select browser-side Google Maps JS key as the initial provider direction.
- [x] Defer server-side proxy provider until a later version.
- [x] Select default country behavior: no default country restriction.
- [x] Define the normalized selected-address result shape.
- [x] Define the initial provider interface for suggestions and selected place details.
- [x] Define the first pass of component prop names.
- [ ] Review the public API after the real provider and dropdown are implemented.
- [ ] Define error states and retry behavior in the rendered component.
- [ ] Define controlled value behavior for manual typing versus selected place data.
- [ ] Decide whether `onAddressSelect` should fire only on dropdown selection or also on exact free-text geocode fallback.
- [ ] Decide which Google request options should be exposed directly beyond the current first pass.

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

- [x] Implement `parseGooglePlaceAddress()`.
- [x] Map Google address components to `addressLine1`, `addressLine2`, `city`, `state`, `stateCode`, `postalCode`, `country`, and `countryCode`.
- [x] Extract latitude and longitude from selected place details.
- [x] Add unit tests for US addresses.
- [x] Add unit tests for addresses without street number.
- [x] Add unit tests for ZIP+4 and missing postal code cases.
- [x] Add unit tests for non-US addresses.
- [ ] Add more international address fixtures after the provider returns real Place objects in the demo.
- [ ] Decide whether the public result should include `postalCodeFull` in addition to `postalCode` and `postalCodeSuffix`.

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

- [x] Decide default CSS strategy: no required stylesheet in v0; headless slots first.
- [x] Expose initial class names and render props for custom UI.
- [ ] Add a small optional example stylesheet in the demo app.
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
- [x] Add parser unit tests.
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
- [x] Document address result shape in the package README.
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

- Should `postalCodeFull` be added as a convenience field?
- Should the provider expose a free-text geocode fallback, or should the component stay selection-only?
- Should the component ship an optional default CSS file before `1.0.0`, or should styling remain fully user-owned?
