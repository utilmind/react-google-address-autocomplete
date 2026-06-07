# react-google-address-autocomplete

Reusable React address autocomplete component powered by Google Places Autocomplete Data API.

## Status

Early implementation. The exported component renders a controlled input, fetches suggestions from a provider, shows a first-pass dropdown, supports mouse selection, and supports basic keyboard navigation. The package also includes the initial public types, a tested Google address parser, a browser Google Maps JavaScript loader, and a tested Google Places Autocomplete Data API provider.

## Design decisions

- Package name: `react-google-address-autocomplete`.
- License: MIT.
- UI model: headless first. The component exposes class names and render props instead of forcing a stylesheet.
- Google integration: browser-side Google Maps JavaScript API key first.
- Server-side proxy provider: deferred.
- Country restriction: unrestricted by default. Pass `countryCodes` when an app wants to restrict results.

## Minimal usage

```tsx
import { useMemo, useState } from 'react'
import { AddressAutocompleteInput, createGooglePlacesAutocompleteProvider } from 'react-google-address-autocomplete'

export function AddressField() {
    const [address, setAddress] = useState('')

    const provider = useMemo(
        () =>
            createGooglePlacesAutocompleteProvider({
                apiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
                defaultRequestOptions: {
                    countryCodes: ['US'],
                    language: 'en',
                    region: 'US',
                },
            }),
        [],
    )

    return (
        <AddressAutocompleteInput
            dropdownClassName="addressDropdown"
            inputClassName="addressInput"
            label="Address"
            placeholder="Start typing an address"
            provider={provider}
            value={address}
            onAddressSelect={(selectedAddress) => {
                console.log(selectedAddress)
            }}
            onValueChange={setAddress}
        />
    )
}
```

## Google provider

```ts
import { createGooglePlacesAutocompleteProvider } from 'react-google-address-autocomplete'

const provider = createGooglePlacesAutocompleteProvider({
    apiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
    defaultRequestOptions: {
        countryCodes: ['US'],
        language: 'en',
        region: 'US',
    },
})

const suggestions = await provider.getSuggestions('13133 34th Street North')
const selectedAddress = await provider.selectSuggestion(suggestions[0])
```

The provider loads the Google Maps JavaScript API in the browser, imports the `places` library, calls `AutocompleteSuggestion.fetchAutocompleteSuggestions()`, and fetches selected place details through the original `PlacePrediction`. It creates one Google `AutocompleteSessionToken` per autocomplete session and resets that token after a successful selection.

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
