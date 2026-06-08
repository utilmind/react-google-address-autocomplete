# TODO: React Google Address Autocomplete

This is the living implementation plan for the component repository. Update it on every meaningful patch.

## 0. Repository foundation

- [x] Create a standalone pnpm workspace.
- [x] Add root Prettier settings matching the machine shop Next.js project.
- [x] Add root TypeScript, ESLint, Git ignore, VS Code, and CI config.
- [x] Add the component package workspace.
- [x] Add the demo app workspace.
- [x] Add an initial placeholder React component and a smoke unit test.
- [x] Run `pnpm install` and commit the generated `pnpm-lock.yaml`.
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
- [ ] Review the public API after the portal dropdown and demo modal are tested in real apps.
- [ ] Define error states and retry behavior in the rendered component.
- [x] Define controlled value behavior for manual typing versus selected place data.
- [ ] Decide whether `onAddressSelect` should fire only on dropdown selection or also on exact free-text geocode fallback.
- [ ] Decide which Google request options should be exposed directly beyond the current first pass.

## 2. Google Places provider

- [x] Add a small Google Maps JS loader.
- [x] Load the `places` library with `google.maps.importLibrary('places')`.
- [x] Implement an Autocomplete Data API provider.
- [x] Create and reuse one `AutocompleteSessionToken` per user autocomplete session.
- [x] Reset the session token after a place is selected.
- [x] Support query debounce in the React component layer.
- [x] Protect against out-of-order async responses.
- [x] Support country restrictions, language, region, and location bias/restriction.
- [x] Add provider-level unit tests with mocked Google globals.
- [x] Add loader unit tests for existing globals and script injection.
- [ ] Revisit provider error classes after component-level error rendering is implemented.

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

- [x] Implement first-pass suggestion dropdown.
- [x] Render dropdown through a portal option for dialogs/modals.
- [x] Add first-pass keyboard navigation: ArrowUp, ArrowDown, Enter, Escape, Tab.
- [x] Add mouse selection.
- [ ] Verify touch selection on mobile devices.
- [x] Add first-pass loading, empty, and error states.
- [x] Add basic disabled and read-only handling.
- [ ] Add deeper disabled and read-only interaction tests.
- [x] Add minimum query length.
- [x] Add max suggestions limit.
- [x] Add basic highlighted matched text rendering.
- [x] Add first-pass ARIA combobox/listbox semantics and active descendant behavior.
- [x] Add a first dedicated a11y pass for combobox/listbox IDs, `aria-controls`, `aria-expanded`, and `aria-activedescendant`.
- [ ] Run a deeper accessibility pass with automated tooling and manual screen-reader checks.

## 5. Styling

- [x] Decide default CSS strategy: no required stylesheet in v0; headless slots first.
- [x] Expose initial class names and render props for custom UI.
- [x] Add a small optional example stylesheet in the demo app.
- [x] Add a portal dropdown demo for a clipped modal/dialog shell.
- [ ] Verify dropdown z-index behavior inside real app dialogs.
- [ ] Verify narrow/mobile layout.

## 6. Demo app

- [x] Add `.env` support for a browser Google Maps API key.
- [x] Add a basic demo page.
- [ ] Add country restriction examples.
- [x] Add a form-fill example that populates address, city, state, ZIP, latitude, and longitude.
- [x] Add an example inside a modal/dialog.
- [ ] Add error-state and empty-state examples.
- [ ] Add README instructions for enabling Google Places API.

## 7. Testing

- [x] Add an initial smoke unit test for the placeholder component.
- [x] Add parser unit tests.
- [x] Add provider tests with mocked Google APIs.
- [x] Add loader tests.
- [x] Add first component interaction tests with Testing Library.
- [x] Add first keyboard selection test.
- [x] Add a test for custom selected input value handling.
- [x] Fix Testing Library cleanup so component tests do not leak DOM between tests.
- [x] Add a portal rendering component test.
- [x] Add first assertions for combobox/listbox ARIA wiring.
- [ ] Add automated accessibility checks.
- [ ] Add demo smoke build in CI.

## 8. Documentation

- [x] Document installation.
- [x] Document minimal usage.
- [ ] Document API key and Google Cloud setup.
- [x] Document session token behavior.
- [ ] Document billing-related caveats.
- [ ] Document Next.js usage.
- [x] Document Vite usage through the demo app.
- [x] Document first-pass styling customization through class names and demo CSS.
- [x] Document address result shape in the package README.
- [x] Document form-fill usage and custom selected input values.
- [ ] Document known limitations.

## 9. Release and npm publication

- [ ] Confirm package name availability.
- [ ] Add `CHANGELOG.md`.
- [ ] Add release script.
- [ ] Add npm provenance if desired.
- [ ] Publish `0.1.0-alpha.0`.
- [ ] Test install from npm in the machine shop Next.js project.
- [ ] Publish `1.0.0` after API stabilization.

## Legacy reference archive

- [x] Keep the old jQuery/Twitter Typeahead implementation under `jquery-legacy/geo-dropdown.js` for historical reference.
- [x] Exclude `jquery-legacy/` from Prettier so the archived file remains untouched.
- [x] Link the legacy file from the root README.

## Open decisions

- Should `postalCodeFull` be added as a convenience field?
- Should the provider expose a free-text geocode fallback, or should the component stay selection-only?
- Should the component ship an optional default CSS file before `1.0.0`, or should styling remain fully user-owned?
