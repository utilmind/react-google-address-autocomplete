# Implementation notes

## Direction

The package is intentionally not a jQuery/Twitter Typeahead port. The old implementation is useful as a behavior reference, but this package should stay idiomatic React:

- controlled input value;
- provider abstraction for suggestions and place selection;
- headless dropdown rendering with class names and render props;
- tested address parsing independent from UI rendering;
- Google Places Autocomplete Data API as the first provider.

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

This should be enough for browser-side Google support now and a future server-side proxy provider later without changing component consumers.

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

The Google provider ignores stale autocomplete responses by default. If request A starts first and request B starts second, A will return an empty array if B has already become the latest request before A resolves. The React component will still need its own request lifecycle handling when the dropdown is implemented.
