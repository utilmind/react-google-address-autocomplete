# React Google Address Autocomplete

Reusable React + TypeScript address autocomplete component powered by Google Places Autocomplete Data API.

This repository is intentionally started as a standalone package, so the component can evolve independently from application code and later be published to npm.

## Goals

- Provide a React-first replacement for old jQuery/Twitter Typeahead address dropdowns.
- Keep the component reusable across Next.js, Vite, and other React apps.
- Use the modern Google Places Autocomplete Data API instead of legacy DOM-mutating plugins.
- Return normalized address data that application forms can use directly.
- Ship a small package with tests, documentation, and a demo app.

## Current status

Initial repository scaffold is ready. The Google integration is planned but not implemented yet.

See [TODO.md](./TODO.md) for the living implementation plan.

## Planned package usage

```tsx
import { AddressAutocompleteInput } from 'react-google-address-autocomplete'

function Example() {
    const [address, setAddress] = React.useState('')

    return (
        <AddressAutocompleteInput
            label="Address"
            value={address}
            onValueChange={setAddress}
            onAddressSelect={(result) => {
                console.log(result.addressLine1)
                console.log(result.city)
                console.log(result.stateCode)
                console.log(result.postalCode)
                console.log(result.latitude, result.longitude)
            }}
        />
    )
}
```

## Development

```bash
pnpm install
pnpm dev
pnpm test
pnpm typecheck
pnpm build
```

## Repository layout

```txt
apps/demo/                                  Demo application
packages/react-google-address-autocomplete/ Published component package
TODO.md                                     Living project plan
```
