import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { describe, expect, it, vi } from 'vitest'

import { AddressAutocompleteInput } from './address-autocomplete-input'
import type { AddressAutocompleteProvider, AddressSuggestion, SelectedAddress } from './types'

const mockSuggestion: AddressSuggestion = {
    placeId: 'place-1',
    mainText: '13133 34th Street North',
    secondaryText: 'Clearwater, FL, USA',
    fullText: '13133 34th Street North, Clearwater, FL, USA',
    mainTextMatches: [{ startOffset: 0, endOffset: 5 }],
    fullTextMatches: [],
    types: ['street_address'],
}

const mockSelectedAddress: SelectedAddress = {
    placeId: 'place-1',
    formattedAddress: '13133 34th Street North, Clearwater, FL 33762, USA',
    addressLine1: '13133 34th Street North',
    addressLine2: '',
    city: 'Clearwater',
    state: 'Florida',
    stateCode: 'FL',
    postalCode: '33762',
    postalCodeSuffix: '',
    country: 'United States',
    countryCode: 'US',
    latitude: 27.8901,
    longitude: -82.6801,
}

function StatefulAddressInput({
    provider,
    onAddressSelect,
}: {
    provider?: AddressAutocompleteProvider
    onAddressSelect?: (address: SelectedAddress) => void
}) {
    const [value, setValue] = useState('')

    return (
        <AddressAutocompleteInput
            debounceMs={0}
            label="Address"
            placeholder="Start typing"
            provider={provider}
            value={value}
            onAddressSelect={onAddressSelect}
            onValueChange={setValue}
        />
    )
}

function createMockProvider(): AddressAutocompleteProvider {
    return {
        getSuggestions: vi.fn(async () => [mockSuggestion]),
        selectSuggestion: vi.fn(async () => mockSelectedAddress),
        resetSession: vi.fn(),
    }
}

describe('AddressAutocompleteInput', () => {
    it('renders a controlled address input', async () => {
        const user = userEvent.setup()

        render(<StatefulAddressInput />)

        const input = screen.getByLabelText('Address') as HTMLInputElement
        await user.type(input, '13133 34th Street North')

        expect(input.value).toBe('13133 34th Street North')
    })

    it('fetches and renders suggestions while typing', async () => {
        const user = userEvent.setup()
        const provider = createMockProvider()

        render(<StatefulAddressInput provider={provider} />)

        const input = screen.getByLabelText('Address')
        await user.type(input, '13133')

        expect(await screen.findByRole('option', { name: /13133 34th Street North/i })).toBeTruthy()
        expect(provider.getSuggestions).toHaveBeenCalledWith(
            '13133',
            expect.objectContaining({ countryCodes: undefined }),
        )
    })

    it('selects a suggestion with the mouse', async () => {
        const user = userEvent.setup()
        const provider = createMockProvider()
        const handleAddressSelect = vi.fn()

        render(<StatefulAddressInput provider={provider} onAddressSelect={handleAddressSelect} />)

        const input = screen.getByLabelText('Address') as HTMLInputElement
        await user.type(input, '13133')
        await user.click(await screen.findByRole('option', { name: /13133 34th Street North/i }))

        await waitFor(() => {
            expect(input.value).toBe('13133 34th Street North, Clearwater, FL 33762, USA')
        })
        expect(provider.selectSuggestion).toHaveBeenCalledWith(mockSuggestion)
        expect(handleAddressSelect).toHaveBeenCalledWith(mockSelectedAddress)
    })

    it('selects the highlighted suggestion with Enter', async () => {
        const user = userEvent.setup()
        const provider = createMockProvider()

        render(<StatefulAddressInput provider={provider} />)

        const input = screen.getByLabelText('Address') as HTMLInputElement
        await user.type(input, '13133')
        await screen.findByRole('option', { name: /13133 34th Street North/i })
        await user.keyboard('{Enter}')

        await waitFor(() => {
            expect(input.value).toBe('13133 34th Street North, Clearwater, FL 33762, USA')
        })
    })
})
