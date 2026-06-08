import { useMemo, useState } from 'react'
import {
    AddressAutocompleteInput,
    createGooglePlacesAutocompleteProvider,
    type AddressAutocompleteProvider,
    type SelectedAddress,
} from 'react-google-address-autocomplete'

const googleMapsApiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY

interface AddressFormState {
    address: string
    city: string
    state: string
    zip: string
    latitude: string
    longitude: string
}

const emptyAddressFormState: AddressFormState = {
    address: '',
    city: '',
    state: '',
    zip: '',
    latitude: '',
    longitude: '',
}

export default function App() {
    const [address, setAddress] = useState('')
    const [formFields, setFormFields] = useState<AddressFormState>(emptyAddressFormState)
    const [modalAddress, setModalAddress] = useState('')
    const [selectedAddress, setSelectedAddress] = useState<SelectedAddress | null>(null)
    const [selectedFormAddress, setSelectedFormAddress] = useState<SelectedAddress | null>(null)
    const [selectedModalAddress, setSelectedModalAddress] = useState<SelectedAddress | null>(null)
    const [isModalOpen, setIsModalOpen] = useState(false)

    const inlineProvider = useMemo(createDemoProvider, [])
    const formProvider = useMemo(createDemoProvider, [])
    const modalProvider = useMemo(createDemoProvider, [])

    return (
        <main className="page-shell">
            <div className="demo-stack">
                <section className="demo-card">
                    <p className="eyebrow">Component demo</p>
                    <h1>React Google Address Autocomplete</h1>
                    <p className="summary">
                        Type an address to fetch Google Places suggestions. Add a browser-restricted Google Maps
                        JavaScript API key to <code>apps/demo/.env</code> to enable live suggestions.
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
                </section>

                <section className="demo-card">
                    <p className="eyebrow">Form fill example</p>
                    <h2>Populate separate address fields</h2>
                    <p className="summary">
                        This example stores the selected place as structured form data. The autocomplete input keeps the
                        street address only, while city, state, ZIP, latitude, and longitude are copied from the
                        selected Google Place result.
                    </p>

                    <div className="form-grid">
                        <AddressAutocompleteInput
                            className="field form-field form-field-wide"
                            dropdownClassName="dropdown"
                            getSelectedAddressInputValue={(selected) =>
                                selected.addressLine1 || selected.formattedAddress
                            }
                            highlightedSuggestionClassName="suggestionHighlighted"
                            inputClassName="input"
                            label="Address"
                            placeholder="Start typing a street address"
                            provider={formProvider}
                            statusMessageClassName="statusMessage"
                            suggestionClassName="suggestion"
                            value={formFields.address}
                            onAddressSelect={(selected) => {
                                setSelectedFormAddress(selected)
                                setFormFields(selectedAddressToFormState(selected))
                            }}
                            onValueChange={(nextAddress) => {
                                setSelectedFormAddress(null)
                                setFormFields((current) => ({ ...current, address: nextAddress }))
                            }}
                        />

                        <FormTextInput
                            label="City"
                            value={formFields.city}
                            onValueChange={(city) => setFormFields((current) => ({ ...current, city }))}
                        />
                        <FormTextInput
                            label="State"
                            value={formFields.state}
                            onValueChange={(state) => setFormFields((current) => ({ ...current, state }))}
                        />
                        <FormTextInput
                            label="ZIP"
                            value={formFields.zip}
                            onValueChange={(zip) => setFormFields((current) => ({ ...current, zip }))}
                        />
                        <FormTextInput
                            label="Latitude"
                            value={formFields.latitude}
                            onValueChange={(latitude) => setFormFields((current) => ({ ...current, latitude }))}
                        />
                        <FormTextInput
                            label="Longitude"
                            value={formFields.longitude}
                            onValueChange={(longitude) => setFormFields((current) => ({ ...current, longitude }))}
                        />
                    </div>

                    <div className="actions">
                        <button
                            type="button"
                            onClick={() => {
                                setSelectedFormAddress(null)
                                setFormFields(emptyAddressFormState)
                            }}
                        >
                            Reset form
                        </button>
                    </div>

                    <dl className="output">
                        <dt>Selected place</dt>
                        <dd>
                            {selectedFormAddress
                                ? formatSelectedAddress(selectedFormAddress)
                                : 'No structured address selected yet'}
                        </dd>
                    </dl>
                </section>

                <section className="demo-card">
                    <p className="eyebrow">Portal example</p>
                    <h2>Dropdown inside modal/dialog shells</h2>
                    <p className="summary">
                        Open the clipped modal example to verify that the dropdown can render through{' '}
                        <code>document.body</code> and escape overflow or stacking contexts.
                    </p>
                    <div className="actions">
                        <button type="button" onClick={() => setIsModalOpen(true)}>
                            Open modal portal demo
                        </button>
                    </div>
                </section>
            </div>

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

function FormTextInput({
    label,
    value,
    onValueChange,
}: {
    label: string
    value: string
    onValueChange: (value: string) => void
}) {
    return (
        <label className="field form-field">
            <span>{label}</span>
            <input className="input" value={value} onChange={(event) => onValueChange(event.currentTarget.value)} />
        </label>
    )
}

function selectedAddressToFormState(address: SelectedAddress): AddressFormState {
    return {
        address: address.addressLine1 || address.formattedAddress,
        city: address.city,
        state: address.stateCode || address.state,
        zip: formatPostalCode(address),
        latitude: formatNullableCoordinate(address.latitude),
        longitude: formatNullableCoordinate(address.longitude),
    }
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
        formatPostalCode(address),
        address.countryCode,
    ]
        .filter(Boolean)
        .join(', ')
        .concat(coordinates)
}

function formatPostalCode(address: SelectedAddress): string {
    if (address.postalCode && address.postalCodeSuffix) {
        return `${address.postalCode}-${address.postalCodeSuffix}`
    }

    return address.postalCode
}

function formatNullableCoordinate(value: number | null): string {
    return value === null ? '' : value.toFixed(6)
}
