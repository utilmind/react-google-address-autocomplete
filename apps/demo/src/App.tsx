import { useMemo, useState } from 'react'
import {
    AddressAutocompleteInput,
    createGooglePlacesAutocompleteProvider,
    type AddressAutocompleteProvider,
    type SelectedAddress,
} from 'react-google-address-autocomplete'

const googleMapsApiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY

export default function App() {
    const [address, setAddress] = useState('')
    const [modalAddress, setModalAddress] = useState('')
    const [selectedAddress, setSelectedAddress] = useState<SelectedAddress | null>(null)
    const [selectedModalAddress, setSelectedModalAddress] = useState<SelectedAddress | null>(null)
    const [isModalOpen, setIsModalOpen] = useState(false)

    const inlineProvider = useMemo(createDemoProvider, [])
    const modalProvider = useMemo(createDemoProvider, [])

    return (
        <main className="page-shell">
            <section className="demo-card">
                <p className="eyebrow">Component demo</p>
                <h1>React Google Address Autocomplete</h1>
                <p className="summary">
                    Type an address to fetch Google Places suggestions. Add a browser-restricted Google Maps JavaScript
                    API key to <code>apps/demo/.env</code> to enable live suggestions.
                </p>

                {!inlineProvider ? (
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
                    provider={inlineProvider}
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

                <div className="actions">
                    <button type="button" onClick={() => setIsModalOpen(true)}>
                        Open modal portal demo
                    </button>
                </div>
            </section>

            {isModalOpen ? (
                <div className="modal-backdrop">
                    <section aria-labelledby="modal-title" aria-modal="true" className="modal-card" role="dialog">
                        <button className="close-button" type="button" onClick={() => setIsModalOpen(false)}>
                            Close
                        </button>
                        <p className="eyebrow">Portal example</p>
                        <h2 id="modal-title">Address autocomplete inside a clipped modal</h2>
                        <p className="summary">
                            This field renders its dropdown through <code>document.body</code>, so the list can escape
                            modal overflow and stacking contexts.
                        </p>

                        <AddressAutocompleteInput
                            className="field"
                            dropdownClassName="dropdown"
                            dropdownPortal
                            dropdownStyle={{ zIndex: 1000 }}
                            highlightedSuggestionClassName="suggestionHighlighted"
                            inputClassName="input"
                            label="Modal address"
                            placeholder="Start typing an address"
                            provider={modalProvider}
                            statusMessageClassName="statusMessage"
                            suggestionClassName="suggestion"
                            value={modalAddress}
                            onAddressSelect={setSelectedModalAddress}
                            onValueChange={setModalAddress}
                        />

                        <dl className="output">
                            <dt>Selected address</dt>
                            <dd>
                                {selectedModalAddress
                                    ? formatSelectedAddress(selectedModalAddress)
                                    : 'No modal address selected yet'}
                            </dd>
                        </dl>
                    </section>
                </div>
            ) : null}
        </main>
    )
}

function createDemoProvider(): AddressAutocompleteProvider | undefined {
    if (!googleMapsApiKey) {
        return undefined
    }

    return createGooglePlacesAutocompleteProvider({
        apiKey: googleMapsApiKey,
        defaultRequestOptions: {
            language: 'en',
        },
    })
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
