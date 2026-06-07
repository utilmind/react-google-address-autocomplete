# Implementation notes

## Google API direction

The component should target the modern Google Places Autocomplete Data API. The old jQuery implementation used a Typeahead-style UI over Google Places predictions, but this repository should implement the same product behavior in React rather than carrying over jQuery DOM mutation.

Useful references:

- https://developers.google.com/maps/documentation/javascript/place-autocomplete-data
- https://developers.google.com/maps/documentation/javascript/reference/autocomplete-data
- https://developers.google.com/maps/documentation/javascript/place-autocomplete-new

## High-level data flow

```txt
User input
    -> debounce
    -> provider.fetchSuggestions(query, sessionToken)
    -> dropdown suggestions
    -> user selects place
    -> provider.fetchPlaceDetails(place, sessionToken)
    -> parse normalized address result
    -> onAddressSelect(result)
    -> reset session token
```

## Initial normalized address fields

```ts
interface SelectedAddress {
    placeId: string
    formattedAddress: string
    addressLine1: string
    addressLine2: string
    city: string
    state: string
    stateCode: string
    postalCode: string
    country: string
    countryCode: string
    latitude: number | null
    longitude: number | null
}
```

This shape is intentionally application-friendly. It should let a form fill common fields without leaking Google-specific place internals into application code.
