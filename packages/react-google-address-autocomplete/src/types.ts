import type { ComponentPropsWithoutRef, ReactNode } from 'react'

export interface AddressSuggestion {
    placeId: string
    mainText: string
    secondaryText: string
    fullText: string
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
    country: string
    countryCode: string
    latitude: number | null
    longitude: number | null
}

export type AddressAutocompleteStatus = 'idle' | 'loading' | 'open' | 'empty' | 'error'

export interface AddressAutocompleteInputProps
    extends Omit<ComponentPropsWithoutRef<'input'>, 'children' | 'className' | 'onChange' | 'onSelect' | 'type' | 'value'> {
    value: string
    onValueChange: (value: string) => void
    onAddressSelect?: (address: SelectedAddress) => void
    label?: ReactNode
    className?: string
    inputClassName?: string
    dropdownClassName?: string
    minQueryLength?: number
    debounceMs?: number
    maxSuggestions?: number
    countryCodes?: readonly string[]
}
