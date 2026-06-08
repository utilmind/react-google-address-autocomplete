import { useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import {
    AddressAutocompleteInput,
    createGooglePlacesAutocompleteProvider,
    type AddressAutocompleteProvider,
    type AddressAutocompleteRenderSuggestionProps,
    type AddressTextMatch,
    type SelectedAddress,
} from 'react-google-address-autocomplete'

const googleMapsApiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY

interface AddressFormState {
    address: string
    city: string
    state: string
    zip: string
    country: string
    latitude: string
    longitude: string
}

const emptyAddressFormState: AddressFormState = {
    address: '',
    city: '',
    state: '',
    zip: '',
    country: '',
    latitude: '',
    longitude: '',
}

export default function App() {
    const [address, setAddress] = useState('')
    const [formFields, setFormFields] = useState<AddressFormState>(emptyAddressFormState)
    const [modalAddress, setModalAddress] = useState('')
    const [selectedAddress, setSelectedAddress] = useState<SelectedAddress | null>(null)
    const [selectedFormAddress, setSelectedFormAddress] = useState<SelectedAddress | null>(null)
    const [formLookupError, setFormLookupError] = useState<string | null>(null)
    const [isFormLookupPending, setIsFormLookupPending] = useState(false)
    const [selectedModalAddress, setSelectedModalAddress] = useState<SelectedAddress | null>(null)
    const [isModalOpen, setIsModalOpen] = useState(false)

    const inlineProvider = useMemo(() => createDemoProvider(), [])
    const formProvider = useMemo(() => createDemoProvider(), [])
    const modalProvider = useMemo(() => createDemoProvider(), [])

    const formLookupQuery = formatFormAddressLookupQuery(formFields)
    const canLookupFormAddress = Boolean(formProvider?.lookupAddress && formLookupQuery && !isFormLookupPending)

    function updateFormField(field: keyof AddressFormState, value: string) {
        setFormLookupError(null)
        setSelectedFormAddress(null)
        setFormFields((current) => ({ ...current, [field]: value }))
    }

    async function handleFormAddressLookup() {
        if (!formProvider?.lookupAddress || !formLookupQuery) {
            return
        }

        setIsFormLookupPending(true)
        setFormLookupError(null)
        logDemoEvent('form:lookupAddress:start', { query: formLookupQuery })

        try {
            const lookedUpAddress = await formProvider.lookupAddress(formLookupQuery)

            if (!lookedUpAddress) {
                logDemoEvent('form:lookupAddress:noResult', { query: formLookupQuery })
                setSelectedFormAddress(null)
                setFormLookupError('No matching address found.')
                return
            }

            logDemoEvent('form:lookupAddress:success', lookedUpAddress)
            setSelectedFormAddress(lookedUpAddress)
            setFormFields(selectedAddressToFormState(lookedUpAddress))
        } catch (reason) {
            logDemoEvent('form:lookupAddress:error', reason)
            setSelectedFormAddress(null)
            setFormLookupError(toErrorMessage(reason))
        } finally {
            setIsFormLookupPending(false)
        }
    }

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
                    <p className="summary">One-line suggestions, with a “Loading” spinner, US only.</p>

                    {!inlineProvider ? (
                        <p className="notice">
                            Live Google suggestions are disabled because <code>VITE_GOOGLE_MAPS_API_KEY</code> is empty.
                        </p>
                    ) : null}

                    <AddressAutocompleteInput
                        className="field"
                        dropdownClassName="dropdown singleLineDropdown"
                        highlightedSuggestionClassName="suggestionHighlighted"
                        inputClassName="input"
                        label="Address"
                        placeholder="Start typing an address"
                        previewHighlightedSuggestion
                        showLoading
                        provider={inlineProvider}
                        countryCodes={['US']}
                        statusMessageClassName="statusMessage"
                        suggestionClassName="suggestion"
                        renderLoading={renderInlineLoading}
                        value={address}
                        renderSuggestion={renderSingleLineAddressSuggestion}
                        onAddressSelect={(nextSelectedAddress) => {
                            logDemoEvent('inline:onAddressSelect', nextSelectedAddress)
                            setSelectedAddress(nextSelectedAddress)
                        }}
                        onValueChange={(nextAddress) => {
                            logDemoEvent('inline:onValueChange', nextAddress)
                            setAddress(nextAddress)
                        }}
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
                        street address only, while city, state, ZIP, country, latitude, and longitude are copied from
                        the selected Google Place result.
                    </p>

                    <p className="summary">Two-line suggestions, no “Loading” row, worldwide.</p>

                    <div className="form-grid">
                        <div className="field form-field form-field-wide addressLookupField">
                            <span>Address</span>
                            <div className="inputButtonGroup">
                                <AddressAutocompleteInput
                                    className="inputButtonAutocomplete"
                                    dropdownClassName="dropdown formDropdown"
                                    getSelectedAddressInputValue={(selected) =>
                                        selected.addressLine1 || selected.formattedAddress
                                    }
                                    highlightedSuggestionClassName="suggestionHighlighted formSuggestionHighlighted"
                                    getHighlightedSuggestionInputValue={(suggestion) =>
                                        suggestion.mainText || suggestion.fullText
                                    }
                                    inputClassName="input inputWithInlineButton"
                                    placeholder="Start typing a street address"
                                    previewHighlightedSuggestion
                                    provider={formProvider}
                                    statusMessageClassName="statusMessage"
                                    suggestionClassName="suggestion formSuggestion"
                                    value={formFields.address}
                                    renderSuggestion={renderAddressSuggestion}
                                    onAddressSelect={(selected) => {
                                        logDemoEvent('form:onAddressSelect', selected)
                                        setFormLookupError(null)
                                        setSelectedFormAddress(selected)
                                        setFormFields(selectedAddressToFormState(selected))
                                    }}
                                    onValueChange={(nextAddress) => {
                                        logDemoEvent('form:onValueChange', nextAddress)
                                        updateFormField('address', nextAddress)
                                    }}
                                />
                                <button
                                    aria-label="Look up the typed address"
                                    className="inputInlineButton"
                                    disabled={!canLookupFormAddress}
                                    type="button"
                                    onClick={() => void handleFormAddressLookup()}
                                    onMouseDown={(event) => event.preventDefault()}
                                >
                                    <span className="inputInlineButtonContent">
                                        {isFormLookupPending ? (
                                            <DemoSpinnerIcon className="loadingSpinner" />
                                        ) : (
                                            <DemoMapPinSearchIcon className="buttonIcon" />
                                        )}
                                        <span>Lookup</span>
                                    </span>
                                </button>
                            </div>
                            <small className="lookupHelpText">
                                Select a suggestion from the dropdown, or click Lookup to explicitly look up the typed
                                address. Nothing runs on blur.
                            </small>
                            {formLookupError ? <small className="lookupErrorText">{formLookupError}</small> : null}
                        </div>

                        <FormTextInput
                            label="City"
                            value={formFields.city}
                            onValueChange={(city) => updateFormField('city', city)}
                        />
                        <FormTextInput
                            label="State"
                            value={formFields.state}
                            onValueChange={(state) => updateFormField('state', state)}
                        />
                        <FormTextInput
                            label="ZIP"
                            value={formFields.zip}
                            onValueChange={(zip) => updateFormField('zip', zip)}
                        />
                        <FormTextInput
                            label="Country"
                            value={formFields.country}
                            onValueChange={(country) => updateFormField('country', country)}
                        />
                        <FormTextInput
                            label="Latitude"
                            value={formFields.latitude}
                            onValueChange={(latitude) => updateFormField('latitude', latitude)}
                        />
                        <FormTextInput
                            label="Longitude"
                            value={formFields.longitude}
                            onValueChange={(longitude) => updateFormField('longitude', longitude)}
                        />
                    </div>

                    <div className="actions">
                        <button
                            type="button"
                            onClick={() => {
                                setFormLookupError(null)
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
                            previewHighlightedSuggestion
                            provider={modalProvider}
                            statusMessageClassName="statusMessage"
                            suggestionClassName="suggestion"
                            value={modalAddress}
                            renderSuggestion={renderAddressSuggestion}
                            onAddressSelect={(nextSelectedAddress) => {
                                logDemoEvent('modal:onAddressSelect', nextSelectedAddress)
                                setSelectedModalAddress(nextSelectedAddress)
                            }}
                            onValueChange={(nextAddress) => {
                                logDemoEvent('modal:onValueChange', nextAddress)
                                setModalAddress(nextAddress)
                            }}
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

function renderInlineLoading() {
    return (
        <span className="loadingStatus">
            <DemoSpinnerIcon className="loadingSpinner" />
            Loading...
        </span>
    )
}

function renderSingleLineAddressSuggestion({ suggestion }: AddressAutocompleteRenderSuggestionProps) {
    return (
        <div className="singleLineSuggestion">
            <DemoMapPinIcon className="suggestionIcon" />
            <span className="singleLineSuggestionText">
                <span className="suggestionMainText">
                    {renderMatchedText(suggestion.mainText || suggestion.fullText, suggestion.mainTextMatches)}
                </span>
                {suggestion.secondaryText ? (
                    <span className="singleLineSecondaryText">, {suggestion.secondaryText}</span>
                ) : null}
            </span>
        </div>
    )
}

function renderAddressSuggestion({ suggestion }: AddressAutocompleteRenderSuggestionProps) {
    return (
        <div className="suggestionContent">
            <DemoMapPinIcon className="suggestionIcon" />
            <div className="suggestionText">
                <div className="suggestionMainText">
                    {renderMatchedText(suggestion.mainText || suggestion.fullText, suggestion.mainTextMatches)}
                </div>
                {suggestion.secondaryText ? <small>{suggestion.secondaryText}</small> : null}
            </div>
        </div>
    )
}

function DemoSpinnerIcon({ className }: { className?: string }) {
    return (
        <svg
            aria-hidden="true"
            className={className}
            fill="none"
            height="16"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            viewBox="0 0 24 24"
            width="16"
        >
            <path d="M21 12a9 9 0 1 1-6.219-8.56" />
        </svg>
    )
}

function DemoMapPinIcon({ className }: { className?: string }) {
    return (
        <svg
            aria-hidden="true"
            className={className}
            fill="none"
            height="18"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            viewBox="0 0 24 24"
            width="18"
        >
            <path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0" />
            <circle cx="12" cy="10" r="3" />
        </svg>
    )
}

function DemoMapPinSearchIcon({ className }: { className?: string }) {
    return (
        <svg
            aria-hidden="true"
            className={className}
            fill="none"
            height="16"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            viewBox="0 0 24 24"
            width="16"
        >
            <path d="M11 16.5c-1.4-1.2-5-4.7-5-8a6 6 0 0 1 10.4-4.1" />
            <path d="M9.5 8.5a2.5 2.5 0 0 1 2.5-2.5" />
            <circle cx="17" cy="14" r="3" />
            <path d="m19.5 16.5 2 2" />
        </svg>
    )
}

function renderMatchedText(text: string, matches: readonly AddressTextMatch[]): ReactNode {
    if (!matches.length) {
        return text
    }

    const fragments: ReactNode[] = []
    let cursor = 0

    for (const match of matches) {
        const startOffset = clamp(match.startOffset, 0, text.length)
        const endOffset = clamp(match.endOffset, startOffset, text.length)

        if (startOffset > cursor) {
            fragments.push(text.slice(cursor, startOffset))
        }

        if (endOffset > startOffset) {
            fragments.push(<mark key={`${startOffset}-${endOffset}`}>{text.slice(startOffset, endOffset)}</mark>)
        }

        cursor = endOffset
    }

    if (cursor < text.length) {
        fragments.push(text.slice(cursor))
    }

    return fragments
}

function clamp(value: number, min: number, max: number): number {
    return Math.min(Math.max(value, min), max)
}

function logDemoEvent(eventName: string, payload: unknown) {
    console.info(`[RGAC demo] ${eventName}`, payload)
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
            <input
                autoComplete="one-time-code"
                className="input"
                name={`rgac-demo-${label.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`}
                value={value}
                onChange={(event) => onValueChange(event.currentTarget.value)}
            />
        </label>
    )
}

function formatFormAddressLookupQuery(form: AddressFormState): string {
    return [form.address, form.city, form.state, form.zip, form.country]
        .map((part) => part.trim())
        .filter(Boolean)
        .join(', ')
}

function toErrorMessage(reason: unknown): string {
    return reason instanceof Error ? reason.message : 'Address lookup failed.'
}

function selectedAddressToFormState(address: SelectedAddress): AddressFormState {
    return {
        address: address.addressLine1 || address.formattedAddress,
        city: address.city,
        state: address.stateCode || address.state,
        zip: formatPostalCode(address),
        country: address.country || address.countryCode,
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
