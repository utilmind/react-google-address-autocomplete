# react-google-address-autocomplete

Reusable React address autocomplete component powered by Google Places Autocomplete Data API.

## Status

Early implementation. The exported component currently renders a controlled input, and the package now includes the initial public types plus a tested Google address parser. The real Google Places provider and dropdown UI are the next implementation steps.

## Design decisions

- Package name: `react-google-address-autocomplete`.
- License: MIT.
- UI model: headless first. The component exposes class names and render props instead of forcing a stylesheet.
- Google integration: browser-side Google Maps JavaScript API key first.
- Server-side proxy provider: deferred.
- Country restriction: unrestricted by default. Pass `countryCodes` when an app wants to restrict results.

## Selected address shape

```ts
export interface SelectedAddress {
    placeId: string
    formattedAddress: string
    addressLine1: string
    addressLine2: string
    city: string
    state: string
    stateCode: string
    postalCode: string
    postalCodeSuffix: string
    country: string
    countryCode: string
    latitude: number | null
    longitude: number | null
    rawPlace?: unknown
}
```

## Parser utility

The package exports `parseGooglePlaceAddress()` so address-component parsing can be tested and reused independently from React rendering.

```ts
import { parseGooglePlaceAddress } from 'react-google-address-autocomplete'

const selectedAddress = parseGooglePlaceAddress(place)
```

The parser accepts both newer Google Maps JavaScript Place-like fields, such as `formattedAddress` and `addressComponents`, and legacy-shaped fields, such as `formatted_address` and `address_components`. This keeps unit tests simple and makes future provider implementation less brittle.
