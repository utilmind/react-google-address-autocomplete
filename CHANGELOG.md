# Changelog

All notable changes to this project will be documented in this file.

This project currently has no published npm release. The package version remains `0.0.0` while the API is being tested in real applications.

## Unreleased

### Added

- Controlled, headless `AddressAutocompleteInput` component.
- Browser-side Google Places Autocomplete Data API provider.
- Google Maps JavaScript API loader.
- Normalized `SelectedAddress` parser and related types.
- Dropdown suggestions with keyboard, mouse, portal, loading, empty, and error states.
- Optional highlighted-suggestion preview for Twitter Typeahead-style keyboard navigation.
- Explicit provider-level `lookupAddress()` method for button-driven free-text lookup.
- Demo app with one-line, two-line, form-fill, portal, empty-state, and error-state examples.
- Unit tests for parser, provider, loader, component interactions, portal rendering, and disabled/read-only behavior.

### Changed

- Browser autofill suppression now defaults to `autoComplete="one-time-code"` with a neutral generated input name.
- Loading rows are hidden by default and can be enabled with `showLoading`.

### Documentation

- Added split API reference for properties/options, rendering/styling options, events, provider methods, and helper functions.
- Added Vite, Next.js, local package build, billing caveat, browser autofill, explicit lookup, and known limitation notes.
