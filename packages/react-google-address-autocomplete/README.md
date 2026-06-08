# react-google-address-autocomplete

Reusable React address autocomplete component powered by Google Places Autocomplete Data API.

## Status

Early implementation. The exported component renders a controlled input, fetches suggestions from a provider, shows a first-pass dropdown, supports mouse selection, supports basic keyboard navigation, can render the dropdown through a portal for dialogs/modals, can customize the input value after a suggestion is selected, and uses browser-autofill-resistant input defaults. The package also includes the initial public types, a tested Google address parser, a browser Google Maps JavaScript loader, and a tested Google Places Autocomplete Data API provider.

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

## Highlighted suggestion preview

By default, arrow-key navigation only changes the highlighted dropdown item. The typed query stays in the input until the user selects a suggestion. To mimic Twitter Typeahead-style behavior where the highlighted item is previewed inside the input during keyboard navigation, enable `previewHighlightedSuggestion`.

```tsx
<AddressAutocompleteInput previewHighlightedSuggestion provider={provider} value={address} onValueChange={setAddress} />
```

Use `getHighlightedSuggestionInputValue` to control the preview text. This is useful when a form should preview only the street line while the dropdown still shows the full address.

```tsx
<AddressAutocompleteInput
    previewHighlightedSuggestion
    getHighlightedSuggestionInputValue={(suggestion) => suggestion.mainText || suggestion.fullText}
    provider={provider}
    value={address}
    onValueChange={setAddress}
/>
```

The preview is visual component state. It does not call `onValueChange` until the user edits the input or selects a suggestion.

## Filling separate form fields

Use `onAddressSelect` to copy structured place data into the rest of your form. By default, the input value becomes the selected place's formatted address. Use `getSelectedAddressInputValue` when your form should keep a different value in the autocomplete field, such as street address only.

```tsx
const [form, setForm] = useState({
    address: '',
    city: '',
    state: '',
    zip: '',
    country: '',
    latitude: '',
    longitude: '',
})

<AddressAutocompleteInput
    getSelectedAddressInputValue={(selectedAddress) =>
        selectedAddress.addressLine1 || selectedAddress.formattedAddress
    }
    label="Address"
    provider={provider}
    value={form.address}
    onAddressSelect={(selectedAddress) => {
        setForm({
            address: selectedAddress.addressLine1,
            city: selectedAddress.city,
            state: selectedAddress.stateCode || selectedAddress.state,
            zip: selectedAddress.postalCodeSuffix
                ? `${selectedAddress.postalCode}-${selectedAddress.postalCodeSuffix}`
                : selectedAddress.postalCode,
            country: selectedAddress.country || selectedAddress.countryCode,
            latitude: selectedAddress.latitude?.toString() ?? '',
            longitude: selectedAddress.longitude?.toString() ?? '',
        })
    }}
    onValueChange={(address) => {
        setForm((current) => ({ ...current, address }))
    }}
/>
```

## Portal dropdowns

By default, the dropdown is rendered inline under the input. For dialogs, modals, and other containers with `overflow: hidden`, enable portal rendering:

```tsx
<AddressAutocompleteInput
    dropdownClassName="addressDropdown"
    dropdownPortal
    dropdownStyle={{ zIndex: 1000 }}
    inputClassName="addressInput"
    label="Address"
    provider={provider}
    value={address}
    onValueChange={setAddress}
/>
```

When `dropdownPortal` is enabled, the dropdown is rendered into `document.body` by default and receives fixed-position inline styles that match the input's viewport position and width. Use `dropdownPortalContainer` to provide a custom container and `dropdownPortalOffset` to tune the vertical offset.

## Browser autofill

Chrome and other browsers can still show saved address/profile autofill UI over custom autocomplete widgets, even when `autocomplete="off"` is present. To reduce that interference, `AddressAutocompleteInput` defaults to `autoComplete="new-password"` and assigns a neutral generated `name` when the consumer does not pass one.

You can still override both values when your application needs native browser autofill or a stable form field name:

```tsx
<AddressAutocompleteInput
    autoComplete="street-address"
    name="shipping-address"
    provider={provider}
    value={address}
    onValueChange={setAddress}
/>
```

For address-search use cases, keep the defaults unless you intentionally want the browser's saved-profile dropdown.

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

## Demo app

The demo app includes a dark theme, themed dropdown scrollbars, and a local Lucide-style MapPin SVG suggestion icon. These styles are intentionally demo-owned; the package itself remains headless and does not ship required CSS or icon dependencies.

This repository uses pnpm workspaces. Run the demo from the repository root:

```bash
pnpm install
cp apps/demo/.env.example apps/demo/.env
pnpm dev
```

Then add `VITE_GOOGLE_MAPS_API_KEY` to `apps/demo/.env`. The key should be a browser-restricted Google Maps JavaScript API key with Places enabled. To target the demo directly, use `pnpm --filter address-autocomplete-demo dev`.

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
