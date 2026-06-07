import { useMemo, useState } from 'react'
import {
    AddressAutocompleteInput,
    createGooglePlacesAutocompleteProvider,
    type SelectedAddress,
} from 'react-google-address-autocomplete'

const googleMapsApiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY

export default function App() {
    const [address, setAddress] = useState('')
    const [selectedAddress, setSelectedAddress] = useState<SelectedAddress | null>(null)

    const provider = useMemo(() => {
        if (!googleMapsApiKey) {
            return undefined
        }

        return createGooglePlacesAutocompleteProvider({
            apiKey: googleMapsApiKey,
            defaultRequestOptions: {
                language: 'en',
            },
        })
    }, [])

    return (
        <main className="page-shell">
            <section className="demo-card">
                <p className="eyebrow">Component demo</p>
                <h1>React Google Address Autocomplete</h1>
                <p className="summary">
                    Type an address to fetch Google Places suggestions. Add a browser-restricted Google Maps JavaScript
                    API key to <code>apps/demo/.env</code> to enable live suggestions.
                </p>

                {!provider ? (
                    <p className="notice">
                        Live Google suggestions are disabled because <code>VITE_GOOGLE_MAPS_API_KEY</code> is empty.
                    </p>
                ) : null}

                <AddressAutocompleteInput
                    className="field"
                    dropdownClassName="dropdown"
                    highlightedSuggestionClassName="suggestionHighlighted"
                    inputClassName="input"
                    label="Address"
                    placeholder="Start typing an address"
                    provider={provider}
                    statusMessageClassName="statusMessage"
                    suggestionClassName="suggestion"
                    value={address}
                    onAddressSelect={setSelectedAddress}
                    onValueChange={setAddress}
                    renderError={(state) => state.error?.message ?? 'Address lookup failed'}
                />

                <dl className="output">
                    <dt>Current value</dt>
                    <dd>{address || 'No address typed yet'}</dd>

                    <dt>Selected address</dt>
                    <dd>{selectedAddress ? formatSelectedAddress(selectedAddress) : 'No address selected yet'}</dd>
                </dl>
            </section>
        </main>
    )
}

function formatSelectedAddress(address: SelectedAddress): string {
    const coordinates =
        address.latitude !== null && address.longitude !== null
            ? ` (${address.latitude.toFixed(6)}, ${address.longitude.toFixed(6)})`
            : ''

    return [
        address.addressLine1,
        address.city,
        address.stateCode || address.state,
        address.postalCode,
        address.countryCode,
    ]
        .filter(Boolean)
        .join(', ')
        .concat(coordinates)
}
