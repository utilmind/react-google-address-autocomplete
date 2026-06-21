# react-google-address-autocomplete

Reusable React address autocomplete component powered by Google Places Autocomplete Data API.

## Status

Early implementation. The exported component renders a controlled input, fetches suggestions from a provider, shows a first-pass dropdown, supports mouse selection, supports basic keyboard navigation, can render the dropdown through a portal for dialogs/modals, can customize the input value after a suggestion is selected, can softly rerank suggestions by an existing city/state/country form context, hides loading UI by default, and uses browser-autofill-resistant input defaults. The package also includes the initial public types, a tested Google address parser, a browser Google Maps JavaScript loader, and a tested Google Places Autocomplete Data API provider with an explicit free-text address lookup method powered by Places suggestions and Place details.

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

## Restricting the search area

The component is unrestricted by default. To restrict suggestions to a country or group of countries, pass `countryCodes` directly to `AddressAutocompleteInput`. The Google provider maps this option to the Places Autocomplete Data API region restriction for suggestions.

```tsx
<AddressAutocompleteInput
    countryCodes={['US']}
    label="Address"
    provider={provider}
    value={address}
    onValueChange={setAddress}
/>
```

You can also make a provider default when every input in an app should use the same restriction:

```ts
const provider = createGooglePlacesAutocompleteProvider({
    apiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
    defaultRequestOptions: {
        countryCodes: ['US'],
        language: 'en',
        region: 'US',
    },
})
```

Input-level props win over provider defaults, so a reusable provider can still be overridden per field.

## Soft-ranking suggestions by an existing form location

When a form already has city, state, or country fields, pass them through `preferredLocation`. Matching suggestions are moved higher in the dropdown, while non-matching suggestions remain visible in their original Google order. This is intentionally a soft rerank, not a filter.

```tsx
<AddressAutocompleteInput
    preferredLocation={{
        city: form.city,
        stateCode: form.state,
        countryCode: 'US',
    }}
    provider={provider}
    value={form.address}
    onValueChange={(address) => setForm((current) => ({ ...current, address }))}
/>
```

You can also pass a resolver function. Prefer an inline function or a memoized function whose dependencies include the fields it reads, so React can rerender with the newest preferred location.

```tsx
<AddressAutocompleteInput
    preferredLocation={() => ({ city: form.city, state: form.state, country: form.country })}
    provider={provider}
    value={form.address}
    onValueChange={(address) => setForm((current) => ({ ...current, address }))}
/>
```

The preferred location object supports `city`, `state`, `stateCode`, `country`, and `countryCode`. Values are normalized internally for loose matching against suggestion text.

## Component API

`AddressAutocompleteInput` is a controlled, headless component. It forwards most regular `<input>` props, except for props that would conflict with its controlled behavior (`value`, `onChange`, `type`, `className`, `children`, and `onSelect`).

### Properties and options

| Prop                                 | Type                                                                                 | Default                           | Description                                                                                       |
| ------------------------------------ | ------------------------------------------------------------------------------------ | --------------------------------- | ------------------------------------------------------------------------------------------------- |
| `value`                              | `string`                                                                             | required                          | Current input value.                                                                              |
| `provider`                           | `AddressAutocompleteProvider`                                                        | `undefined`                       | Suggestion/details provider. Use `createGooglePlacesAutocompleteProvider()` for Google Places.    |
| `label`                              | `ReactNode`                                                                          | `undefined`                       | Optional label rendered above the input and connected with `htmlFor`.                             |
| `minQueryLength`                     | `number`                                                                             | `1`                               | Minimum trimmed query length before suggestions are fetched.                                      |
| `debounceMs`                         | `number`                                                                             | `250`                             | Debounce delay before fetching suggestions.                                                       |
| `maxSuggestions`                     | `number`                                                                             | `5`                               | Maximum suggestions rendered by the component after provider results return.                      |
| `preferredLocation`                  | `AddressAutocompletePreferredLocation \| () => AddressAutocompletePreferredLocation` | `undefined`                       | Soft-ranks suggestions matching an already selected city, state, or country higher in the list.   |
| `countryCodes`                       | `readonly string[]`                                                                  | unrestricted                      | Restricts suggestions to countries such as `['US']`.                                              |
| `includedPrimaryTypes`               | `readonly string[]`                                                                  | `undefined`                       | Restricts Google predictions to primary place types when the provider supports it.                |
| `language`                           | `string`                                                                             | provider/default browser behavior | Preferred language for suggestions.                                                               |
| `region`                             | `string`                                                                             | provider/default browser behavior | Region hint used by Google for result formatting/ranking.                                         |
| `locationBias`                       | `unknown`                                                                            | `undefined`                       | Biases suggestions toward an area when the provider supports it.                                  |
| `locationRestriction`                | `unknown`                                                                            | `undefined`                       | Restricts suggestions to an area when the provider supports it.                                   |
| `origin`                             | `{ lat: number; lng: number }`                                                       | `undefined`                       | Origin point for distance/ranking when the provider supports it.                                  |
| `getSelectedAddressInputValue`       | `(address, suggestion) => string`                                                    | formatted address                 | Controls what text is committed to the input after selection. Useful for street-only form fields. |
| `previewHighlightedSuggestion`       | `boolean`                                                                            | `false`                           | Shows the highlighted suggestion in the input during arrow-key navigation without committing it.  |
| `getHighlightedSuggestionInputValue` | `(suggestion) => string`                                                             | suggestion full text              | Controls preview text when `previewHighlightedSuggestion` is enabled.                             |
| `showLoading`                        | `boolean`                                                                            | `false`                           | Shows a loading row while suggestions are being fetched.                                          |
| `loadingText`                        | `ReactNode`                                                                          | `Loading…`                        | Localizable fallback loading content.                                                             |
| `dropdownPortal`                     | `boolean`                                                                            | `false`                           | Renders the dropdown through a portal, useful inside dialogs and clipped containers.              |
| `dropdownPortalContainer`            | `HTMLElement \| null \| () => HTMLElement \| null`                                   | `document.body`                   | Portal target when `dropdownPortal` is enabled.                                                   |
| `dropdownPortalOffset`               | `number`                                                                             | `6`                               | Vertical offset between input and portal dropdown.                                                |
| `autoComplete`                       | regular input prop                                                                   | `one-time-code`                   | Browser-autofill suppression value. Override only when native autofill is desired.                |
| `name`                               | regular input prop                                                                   | generated neutral name            | Neutral generated name helps suppress browser profile autofill.                                   |

### Rendering and styling options

| Prop                             | Type                   | Default                 | Description                                                                   |
| -------------------------------- | ---------------------- | ----------------------- | ----------------------------------------------------------------------------- |
| `className`                      | `string`               | `undefined`             | Wrapper class name.                                                           |
| `inputClassName`                 | `string`               | `undefined`             | Input class name.                                                             |
| `dropdownClassName`              | `string`               | `undefined`             | Dropdown/listbox class name.                                                  |
| `dropdownStyle`                  | `CSSProperties`        | `undefined`             | Inline style for the dropdown. Also merged into portal positioning styles.    |
| `suggestionClassName`            | `string`               | `undefined`             | Suggestion row class name.                                                    |
| `highlightedSuggestionClassName` | `string`               | `undefined`             | Extra class name for the highlighted suggestion row.                          |
| `statusMessageClassName`         | `string`               | `undefined`             | Class name for loading, empty, and error rows.                                |
| `renderSuggestion`               | `(props) => ReactNode` | built-in minimal markup | Custom suggestion row renderer.                                               |
| `renderLoading`                  | `(state) => ReactNode` | `undefined`             | Fully custom loading row renderer. Requires `showLoading` to show loading UI. |
| `renderEmpty`                    | `(state) => ReactNode` | `No addresses found`    | Custom empty-state row renderer.                                              |
| `renderError`                    | `(state) => ReactNode` | error message           | Custom error-state row renderer.                                              |

### Events

| Prop              | Type                                 | When it fires                                                                                                                            |
| ----------------- | ------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------- |
| `onValueChange`   | `(value: string) => void`            | Fires when the user types and when a selected suggestion commits a new input value. It does not fire for highlighted-suggestion preview. |
| `onAddressSelect` | `(address: SelectedAddress) => void` | Fires after the user selects a dropdown suggestion and the provider returns parsed place details.                                        |

There is intentionally no `onLookupSuccess` component prop. Explicit lookup is a provider-level action: call `provider.lookupAddress(query, options?)` from your own button or submit handler and handle the returned promise in your application.

### Provider methods

| Method             | Type                                                         | Description                                                                                                                         |
| ------------------ | ------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------- |
| `getSuggestions`   | `(query, options?) => Promise<readonly AddressSuggestion[]>` | Fetches dropdown suggestions for the typed query. The component calls this after debounce.                                          |
| `selectSuggestion` | `(suggestion) => Promise<SelectedAddress>`                   | Fetches place details for a selected suggestion and returns the normalized address. The component calls this on dropdown selection. |
| `lookupAddress`    | `(query, options?) => Promise<SelectedAddress \| null>`      | Optional explicit free-text lookup method. Use it for a “Lookup” / “Verify address” button.                                         |
| `resetSession`     | `() => void`                                                 | Optional method for resetting provider session state. The Google provider exposes it for session-token control.                     |

### Exported helper functions

| Function                                               | Description                                                                                                           |
| ------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------- |
| `createGooglePlacesAutocompleteProvider(options)`      | Creates the browser-side Google Places provider.                                                                      |
| `loadGoogleMapsJavaScriptApi(options)`                 | Loads the Google Maps JavaScript API script. Most apps can use the provider factory instead of calling this directly. |
| `parseGooglePlaceAddress(place)`                       | Converts a Google-like Place object into `SelectedAddress`. Useful for tests or custom providers.                     |
| `getAddressComponent(components, type, useShortName?)` | Reads one address component by Google component type.                                                                 |

## Provider request options

These component props are passed to `provider.getSuggestions(query, options)`: `countryCodes`, `includedPrimaryTypes`, `language`, `region`, `locationBias`, `locationRestriction`, and `origin`. The built-in Google provider merges them with `defaultRequestOptions` from `createGooglePlacesAutocompleteProvider()`. Component props override provider defaults.

## Selection behavior

`onAddressSelect` fires only when the user selects a suggestion from the dropdown. The component does not look up free text on blur, Enter, or form submit. This keeps typing predictable: manual edits update only `value` through `onValueChange`; selected suggestions update `value` and call `onAddressSelect`.

If an application wants to verify a manually typed address, call the provider's explicit `lookupAddress()` method from your own button or submit handler.

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

`preferredLocation` is useful in this form-fill pattern because the already-entered city, state, or country can help move the most likely matching address higher in the dropdown.

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
    preferredLocation={{
        city: form.city,
        state: form.state,
        country: form.country,
    }}
    provider={provider}
    value={form.address}
    onAddressSelect={(selectedAddress) => {
        setForm({
            address: selectedAddress.addressLine1 || selectedAddress.formattedAddress,
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

For explicit verification of a manually typed address, call `provider.lookupAddress()` from your own button or submit handler.

```tsx
async function handleLookup() {
    const query = [form.address, form.city, form.state, form.zip, form.country].filter(Boolean).join(', ')
    const selectedAddress = await provider.lookupAddress?.(query)

    if (!selectedAddress) {
        return
    }

    setForm({
        address: selectedAddress.addressLine1 || selectedAddress.formattedAddress,
        city: selectedAddress.city,
        state: selectedAddress.stateCode || selectedAddress.state,
        zip: selectedAddress.postalCodeSuffix
            ? `${selectedAddress.postalCode}-${selectedAddress.postalCodeSuffix}`
            : selectedAddress.postalCode,
        country: selectedAddress.country || selectedAddress.countryCode,
        latitude: selectedAddress.latitude?.toString() ?? '',
        longitude: selectedAddress.longitude?.toString() ?? '',
    })
}
```

The demo app shows this pattern with an input-adjacent button and a spinner.

## Loading state

The component tracks loading internally while suggestions are being fetched, but it does not show a loading row by default. This keeps the dropdown quiet for fast address searches. Enable `showLoading` when your UI should show an interim loading message. Use `loadingText` for simple localization, or `renderLoading` for fully custom markup such as a spinner.

```tsx
<AddressAutocompleteInput
    showLoading
    loadingText="Loading..."
    provider={provider}
    value={address}
    onValueChange={setAddress}
/>
```

```tsx
<AddressAutocompleteInput
    showLoading
    renderLoading={() => <span className="loadingRow">Loading addresses...</span>}
    provider={provider}
    value={address}
    onValueChange={setAddress}
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

Chrome and other browsers can still show saved address/profile autofill UI over custom autocomplete widgets, even when `autocomplete="off"` is present. To reduce that interference, `AddressAutocompleteInput` defaults to `autoComplete="one-time-code"` and assigns a neutral generated `name` when the consumer does not pass one.

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

For address-search use cases, keep the defaults unless you intentionally want the browser's saved-profile dropdown. This remains best-effort suppression because browsers can still use heuristics that ignore application preferences.

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
const lookedUpAddress = await provider.lookupAddress?.('13133 34th Street North, Clearwater, FL')
```

The provider loads the Google Maps JavaScript API in the browser, imports the `places` library, calls `AutocompleteSuggestion.fetchAutocompleteSuggestions()` for dropdown suggestions and explicit `lookupAddress()` calls, and fetches selected place details through the original `PlacePrediction`. It creates one Google `AutocompleteSessionToken` per autocomplete session and resets that token after a successful dropdown selection.

## Next.js usage

This package is browser-oriented because the built-in Google provider loads the Google Maps JavaScript API and uses
`window.google`. In Next.js App Router projects, render the field from a client component.

```tsx
'use client'

import { useMemo, useState } from 'react'
import { AddressAutocompleteInput, createGooglePlacesAutocompleteProvider } from 'react-google-address-autocomplete'

export function AddressField() {
    const [address, setAddress] = useState('')

    const provider = useMemo(
        () =>
            createGooglePlacesAutocompleteProvider({
                apiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? '',
                defaultRequestOptions: { countryCodes: ['US'] },
            }),
        [],
    )

    return <AddressAutocompleteInput provider={provider} value={address} onValueChange={setAddress} />
}
```

Use a browser-restricted public key such as `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`. Do not put unrestricted server keys in
client components. A future server-proxy provider can be added without changing the component UI API because the
component talks only to the `AddressAutocompleteProvider` interface.

## Billing and quota caveats

The Google provider is designed to use one autocomplete session token per user autocomplete session and reset it after a
place is selected. Keep that behavior enabled because session tokens help Google group prediction requests with the final
place-details request.

Operational caveats to plan for before production use:

- Enable the required Google Maps JavaScript / Places APIs in the same Google Cloud project as the browser key.
- Restrict browser keys by HTTP referrer.
- Set budget alerts and monitor quota usage before exposing the field to public traffic.
- Avoid automatic free-text lookup on blur. The component intentionally leaves `lookupAddress()` as an explicit user action
  so apps do not create surprise lookup traffic while users tab through forms.
- Keep `fetchFields()` focused on the fields needed by the parser and form. The built-in provider requests only the fields
  needed for normalized address output.

## Known limitations

- Browser autofill suppression is best effort. Chrome and Safari can still show saved profile UI based on browser heuristics.
- Touch selection has not had a dedicated manual device pass yet. Mouse and keyboard behavior are covered by unit tests.
- Automated screen-reader tooling has not been added yet. The component has first-pass ARIA combobox/listbox wiring, but
  production apps should still perform manual accessibility checks.
- International address formatting needs more fixtures from real Place objects. The parser supports common US and non-US
  component shapes, but global postal conventions vary.
- The built-in provider is browser-side only. Server-proxy providers are intentionally deferred.

## Manual local package build

Use this flow to build the package into a local `.tgz` file and install it in another project without publishing to npm.

On Windows, the easiest option is to run the repository-root helper script. It runs `pnpm install`, tests, typecheck, build, lint, and then writes a fresh package tarball to `vendor/npm`:

```bat
build-and-pack.bat
```

From the repository root in Git Bash, WSL, macOS, or Linux:

```bash
pnpm install
pnpm --filter react-google-address-autocomplete build
mkdir -p vendor/npm
pnpm --dir packages/react-google-address-autocomplete pack --pack-destination ../../vendor/npm
```

From PowerShell on Windows:

```powershell
pnpm install
pnpm --filter react-google-address-autocomplete build
New-Item -ItemType Directory -Force vendor/npm | Out-Null
pnpm --dir packages/react-google-address-autocomplete pack --pack-destination ../../vendor/npm
```

The last command writes a file similar to:

```text
vendor/npm/react-google-address-autocomplete-0.0.0.tgz
```

Copy that `.tgz` file into your application repository, for example:

```text
your-app/vendor/npm/react-google-address-autocomplete-0.0.0.tgz
```

Then install it from the application repository. With pnpm:

```bash
pnpm add ./vendor/npm/react-google-address-autocomplete-0.0.0.tgz
```

With npm:

```bash
npm install ./vendor/npm/react-google-address-autocomplete-0.0.0.tgz
```

If your app already has the package installed from an older `.tgz`, remove the old lockfile entry or run the same install command again after replacing the file. Keep the package version or tarball filename unique when you want the package manager to reliably pick up a new local build.

## Demo app

The demo app includes a dark theme, themed dropdown scrollbars, local Lucide-style MapPin and MapPinSearch SVG icons, a Lucide-style loading spinner in the first autocomplete example, and local mock providers for empty/error state styling. It also logs `onValueChange`, `onAddressSelect`, and explicit `lookupAddress()` outcomes to the browser console so you can see the important event flow. These styles and logs are intentionally demo-owned; the package itself remains headless and does not ship required CSS or icon dependencies.

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
