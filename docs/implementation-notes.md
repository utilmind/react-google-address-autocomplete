# Implementation notes

## Direction

The package is intentionally not a jQuery/Twitter Typeahead port. The old implementation is useful as a behavior reference, but this package should stay idiomatic React:

- controlled input value;
- provider abstraction for suggestions and place selection;
- headless dropdown rendering with class names and render props;
- tested address parsing independent from UI rendering;
- Google Places Autocomplete Data API as the first provider.

The archived jQuery implementation is kept at [`../jquery-legacy/geo-dropdown.js`](../jquery-legacy/geo-dropdown.js). It should remain a reference file, not a source file imported by the package.

## Google Places Data API notes

The browser-side provider uses the Maps JavaScript `places` library:

1. Load Maps JavaScript API with the `places` library available.
2. Use `google.maps.importLibrary('places')`.
3. Use `AutocompleteSuggestion.fetchAutocompleteSuggestions()` for predictions.
4. Keep one `AutocompleteSessionToken` during a typing/selecting session.
5. Convert the chosen prediction with `placePrediction.toPlace()`.
6. Call `place.fetchFields()` with the minimal fields needed by this package.
7. Reset the session token after a successful selection.

The first provider implementation intentionally keeps `PlacePrediction` objects in a private `placeId -> prediction` cache. This keeps the public `AddressSuggestion` shape provider-neutral while still allowing `selectSuggestion()` to call `toPlace()` on the original Google prediction. Consumers should select suggestions returned by the same provider instance and not persist suggestions across sessions.

Default detail fields:

```ts
const placeFields = ['id', 'formattedAddress', 'addressComponents', 'location']
```

## Provider shape

The first internal provider shape is intentionally small:

```ts
export interface AddressAutocompleteProvider {
    getSuggestions(query: string, options?: AddressAutocompleteRequestOptions): Promise<readonly AddressSuggestion[]>
    selectSuggestion(suggestion: AddressSuggestion): Promise<SelectedAddress>
    resetSession?: () => void
}
```

This is enough for browser-side Google support now and a future server-side proxy provider later without changing component consumers.

## React component policy

The component owns UI lifecycle concerns:

- debounce typing before calling `provider.getSuggestions()`;
- limit rendered suggestions with `maxSuggestions`;
- keep request IDs so stale component-level responses cannot reopen old results;
- render loading, empty, and error slots;
- close the dropdown and reset the provider session on blur, Escape, and Tab;
- call `provider.selectSuggestion()` only when the user chooses a suggestion;
- call `getSelectedAddressInputValue()` when provided so apps can choose what text remains in the input after selection.

The component remains headless. It ships no required stylesheet. Consumers can use class names for simple styling or render props for fully custom suggestion/status markup.

## Portal dropdown policy

Inline dropdown rendering remains the default because it is the simplest and most predictable option for normal forms. Consumers can opt into `dropdownPortal` when the component is used inside dialogs, modal panels, drawers, or any container that may clip the list with `overflow: hidden`.

When portal rendering is enabled, the component:

- renders the dropdown into `document.body` unless `dropdownPortalContainer` is provided;
- measures the input with `getBoundingClientRect()`;
- applies fixed-position inline styles for `top`, `left`, and `width`;
- updates that position on scroll and resize while the dropdown is open;
- keeps the same listbox ID so `aria-controls` and `aria-activedescendant` continue to work across the portal boundary.

The component does not implement a focus trap. Dialog libraries should continue to own focus trapping and modal semantics.

## Browser autofill policy

The component is an address search box, not a personal-profile form field. Native browser address autofill can overlap the custom Places dropdown and select personal saved addresses that are unrelated to the data being edited.

`autocomplete="off"` is not reliable enough for this use case because browsers may still offer saved-profile suggestions based on labels, names, and heuristics. The component therefore defaults the input to `autoComplete="new-password"` and provides a neutral generated `name` when the consumer does not pass one. This is a practical suppression strategy, not a browser-level guarantee. Consumers can still pass `autoComplete` and `name` explicitly when they want native autofill.

## Controlled value policy

The component never owns the input text permanently. User typing is emitted through `onValueChange()`, and selected place details are emitted through `onAddressSelect()`. After a suggestion is selected, the component calls `onValueChange()` with either:

1. the value returned by `getSelectedAddressInputValue(selectedAddress, suggestion)`, when provided; or
2. `selectedAddress.formattedAddress || suggestion.fullText` by default.

This lets a form keep the full formatted address in the input, or keep only `addressLine1` while filling city, state, postal code, and coordinates into separate fields.

## Parser policy

`parseGooglePlaceAddress()` should be conservative. It returns empty strings when Google omits address components and `null` for missing coordinates. It should not guess coordinates or invent address parts.

City fallback order:

1. `locality`
2. `postal_town`
3. `sublocality_level_1`
4. `administrative_area_level_3`
5. `administrative_area_level_2`

## Loader policy

The first loader is browser-only and requires a restricted browser Google Maps JavaScript API key. It injects one script tag and requests the `places` library. A future server-side proxy provider can be added behind the same `AddressAutocompleteProvider` interface without changing the React component API.

## Out-of-order response policy

The Google provider ignores stale autocomplete responses by default. If request A starts first and request B starts second, A will return an empty array if B has already become the latest request before A resolves. The React component also keeps its own request counter so stale responses cannot overwrite the visible dropdown state.

## Demo app policy

The demo app is a Vite workspace and should be run with pnpm from the repository root. The root `dev` script delegates to `apps/demo`. Keep the demo intentionally close to real application usage: a basic inline input, a form-fill example, and a portal dropdown example for modal/dialog shells.

The browser key belongs in `apps/demo/.env` as `VITE_GOOGLE_MAPS_API_KEY`. Do not commit real API keys.

## Highlighted suggestion preview

The component supports an opt-in `previewHighlightedSuggestion` mode to mimic the old Twitter Typeahead behavior. Keyboard navigation can temporarily display the highlighted suggestion in the input without committing it to the controlled `value`. The committed value still changes only through user input or final selection, which keeps the headless controlled API predictable.
