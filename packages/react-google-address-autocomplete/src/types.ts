import type { ComponentPropsWithoutRef, CSSProperties, ReactNode } from 'react'

export interface AddressTextMatch {
    startOffset: number
    endOffset: number
}

export interface AddressSuggestion {
    placeId: string
    mainText: string
    secondaryText: string
    fullText: string
    mainTextMatches: readonly AddressTextMatch[]
    fullTextMatches: readonly AddressTextMatch[]
    distanceMeters?: number
    types: readonly string[]
}

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

export type AddressAutocompleteStatus = 'idle' | 'loading' | 'open' | 'empty' | 'error'

export interface AddressAutocompleteRequestOptions {
    countryCodes?: readonly string[]
    includedPrimaryTypes?: readonly string[]
    language?: string
    region?: string
    locationBias?: unknown
    locationRestriction?: unknown
    origin?: { lat: number; lng: number }
}

export interface AddressAutocompleteProvider {
    getSuggestions: (
        query: string,
        options?: AddressAutocompleteRequestOptions,
    ) => Promise<readonly AddressSuggestion[]>
    selectSuggestion: (suggestion: AddressSuggestion) => Promise<SelectedAddress>
    resetSession?: () => void
}

export interface AddressAutocompleteSlotState {
    status: AddressAutocompleteStatus
    isOpen: boolean
    isLoading: boolean
    highlightedIndex: number
    suggestions: readonly AddressSuggestion[]
    error: Error | null
}

export interface AddressAutocompleteRenderSuggestionProps {
    suggestion: AddressSuggestion
    index: number
    isHighlighted: boolean
    query: string
}

export type AddressAutocompletePortalContainer = HTMLElement | null | (() => HTMLElement | null)

export interface AddressAutocompleteInputProps extends Omit<
    ComponentPropsWithoutRef<'input'>,
    'children' | 'className' | 'onChange' | 'onSelect' | 'type' | 'value'
> {
    value: string
    onValueChange: (value: string) => void
    onAddressSelect?: (address: SelectedAddress) => void
    provider?: AddressAutocompleteProvider
    label?: ReactNode
    className?: string
    inputClassName?: string
    dropdownClassName?: string
    dropdownStyle?: CSSProperties
    suggestionClassName?: string
    highlightedSuggestionClassName?: string
    statusMessageClassName?: string
    minQueryLength?: number
    debounceMs?: number
    maxSuggestions?: number
    countryCodes?: readonly string[]
    includedPrimaryTypes?: readonly string[]
    language?: string
    region?: string
    locationBias?: unknown
    locationRestriction?: unknown
    origin?: { lat: number; lng: number }
    renderSuggestion?: (props: AddressAutocompleteRenderSuggestionProps) => ReactNode
    renderLoading?: (state: AddressAutocompleteSlotState) => ReactNode
    renderEmpty?: (state: AddressAutocompleteSlotState) => ReactNode
    renderError?: (state: AddressAutocompleteSlotState) => ReactNode
    dropdownPortal?: boolean
    dropdownPortalContainer?: AddressAutocompletePortalContainer
    dropdownPortalOffset?: number
}
