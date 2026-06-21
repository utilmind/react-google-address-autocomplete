import { cleanup, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { AddressAutocompleteInput } from './address-autocomplete-input'
import type {
    AddressAutocompletePreferredLocation,
    AddressAutocompleteProvider,
    AddressSuggestion,
    SelectedAddress,
} from './types'

const mockSuggestion: AddressSuggestion = {
    placeId: 'place-1',
    mainText: '13133 34th Street North',
    secondaryText: 'Clearwater, FL, USA',
    fullText: '13133 34th Street North, Clearwater, FL, USA',
    mainTextMatches: [{ startOffset: 0, endOffset: 5 }],
    fullTextMatches: [],
    types: ['street_address'],
}

const secondMockSuggestion: AddressSuggestion = {
    placeId: 'place-2',
    mainText: '13133 USF Laurel Drive',
    secondaryText: 'Tampa, FL, USA',
    fullText: '13133 USF Laurel Drive, Tampa, FL, USA',
    mainTextMatches: [{ startOffset: 0, endOffset: 5 }],
    fullTextMatches: [],
    types: ['street_address'],
}

const cheshireMockSuggestion: AddressSuggestion = {
    placeId: 'place-3',
    mainText: '327 Sandbank Road',
    secondaryText: 'Cheshire, CT, USA',
    fullText: '327 Sandbank Road, Cheshire, CT, USA',
    mainTextMatches: [{ startOffset: 0, endOffset: 3 }],
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
    dropdownPortal,
    provider,
    onAddressSelect,
    getSelectedAddressInputValue,
    previewHighlightedSuggestion,
    getHighlightedSuggestionInputValue,
    showLoading,
    loadingText,
    renderLoading,
    countryCodes,
    preferredLocation,
    disabled,
    readOnly,
}: {
    dropdownPortal?: boolean
    provider?: AddressAutocompleteProvider
    onAddressSelect?: (address: SelectedAddress) => void
    getSelectedAddressInputValue?: (address: SelectedAddress, suggestion: AddressSuggestion) => string
    previewHighlightedSuggestion?: boolean
    getHighlightedSuggestionInputValue?: (suggestion: AddressSuggestion) => string
    showLoading?: boolean
    loadingText?: string
    renderLoading?: () => string
    countryCodes?: readonly string[]
    preferredLocation?: AddressAutocompletePreferredLocation | (() => AddressAutocompletePreferredLocation | null)
    disabled?: boolean
    readOnly?: boolean
}) {
    const [value, setValue] = useState('')

    return (
        <AddressAutocompleteInput
            debounceMs={0}
            countryCodes={countryCodes}
            preferredLocation={preferredLocation}
            disabled={disabled}
            dropdownPortal={dropdownPortal}
            label="Address"
            placeholder="Start typing"
            getSelectedAddressInputValue={getSelectedAddressInputValue}
            previewHighlightedSuggestion={previewHighlightedSuggestion}
            getHighlightedSuggestionInputValue={getHighlightedSuggestionInputValue}
            showLoading={showLoading}
            loadingText={loadingText}
            renderLoading={renderLoading}
            provider={provider}
            readOnly={readOnly}
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

function createTwoSuggestionMockProvider(): AddressAutocompleteProvider {
    return {
        getSuggestions: vi.fn(async () => [mockSuggestion, secondMockSuggestion]),
        selectSuggestion: vi.fn(async () => mockSelectedAddress),
        resetSession: vi.fn(),
    }
}

function createMixedLocationMockProvider(): AddressAutocompleteProvider {
    return {
        getSuggestions: vi.fn(async () => [secondMockSuggestion, cheshireMockSuggestion, mockSuggestion]),
        selectSuggestion: vi.fn(async () => mockSelectedAddress),
        resetSession: vi.fn(),
    }
}

afterEach(() => {
    cleanup()
    vi.clearAllMocks()
})

describe('AddressAutocompleteInput', () => {
    it('renders a controlled address input', async () => {
        const user = userEvent.setup()

        render(<StatefulAddressInput />)

        const input = screen.getByLabelText('Address') as HTMLInputElement
        await user.type(input, '13133 34th Street North')

        expect(input.value).toBe('13133 34th Street North')
    })

    it('uses browser-autofill-resistant defaults for autocomplete inputs', () => {
        render(<StatefulAddressInput />)

        const input = screen.getByLabelText('Address') as HTMLInputElement

        expect(input.getAttribute('autocomplete')).toBe('one-time-code')
        expect(input.name).toMatch(/^rgac-address-search-/)
    })

    it('hides the loading message by default while suggestions are loading', async () => {
        const user = userEvent.setup()
        const provider: AddressAutocompleteProvider = {
            getSuggestions: vi.fn(() => new Promise<readonly AddressSuggestion[]>(() => undefined)),
            selectSuggestion: vi.fn(async () => mockSelectedAddress),
        }

        render(<StatefulAddressInput provider={provider} />)

        await user.type(screen.getByLabelText('Address'), '13133')

        expect(screen.queryByText('Loading…')).toBeNull()
        expect(screen.queryByRole('listbox')).toBeNull()
    })

    it('can show a custom loading message while suggestions are loading', async () => {
        const user = userEvent.setup()
        const provider: AddressAutocompleteProvider = {
            getSuggestions: vi.fn(() => new Promise<readonly AddressSuggestion[]>(() => undefined)),
            selectSuggestion: vi.fn(async () => mockSelectedAddress),
        }

        render(<StatefulAddressInput loadingText="Please wait" showLoading provider={provider} />)

        await user.type(screen.getByLabelText('Address'), '13133')

        expect(await screen.findByText('Please wait')).toBeTruthy()
    })

    it('does not fetch suggestions or change value when disabled', async () => {
        const user = userEvent.setup()
        const provider = createMockProvider()

        render(<StatefulAddressInput disabled provider={provider} />)

        const input = screen.getByLabelText('Address') as HTMLInputElement
        await user.click(input)
        await user.type(input, '13133')

        expect(input.value).toBe('')
        expect(provider.getSuggestions).not.toHaveBeenCalled()
        expect(screen.queryByRole('listbox')).toBeNull()
    })

    it('does not fetch suggestions or change value when read-only', async () => {
        const user = userEvent.setup()
        const provider = createMockProvider()

        render(<StatefulAddressInput readOnly provider={provider} />)

        const input = screen.getByLabelText('Address') as HTMLInputElement
        await user.click(input)
        await user.type(input, '13133')

        expect(input.value).toBe('')
        expect(provider.getSuggestions).not.toHaveBeenCalled()
        expect(screen.queryByRole('listbox')).toBeNull()
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

    it('passes country restrictions to the provider', async () => {
        const user = userEvent.setup()
        const provider = createMockProvider()

        render(<StatefulAddressInput countryCodes={['US']} provider={provider} />)

        await user.type(screen.getByLabelText('Address'), '13133')
        await screen.findByRole('option', { name: /13133 34th Street North/i })

        expect(provider.getSuggestions).toHaveBeenCalledWith('13133', expect.objectContaining({ countryCodes: ['US'] }))
    })

    it('moves suggestions matching the preferred city and state higher without filtering the rest', async () => {
        const user = userEvent.setup()
        const provider = createMixedLocationMockProvider()

        render(
            <StatefulAddressInput
                preferredLocation={{ city: 'Cheshire', stateCode: 'CT', countryCode: 'US' }}
                provider={provider}
            />,
        )

        await user.type(screen.getByLabelText('Address'), '327')

        const options = await screen.findAllByRole('option')

        expect(options.map((option) => option.textContent)).toEqual([
            expect.stringContaining('327 Sandbank Road'),
            expect.stringContaining('13133 USF Laurel Drive'),
            expect.stringContaining('13133 34th Street North'),
        ])
    })

    it('accepts a preferred-location resolver function', async () => {
        const user = userEvent.setup()
        const provider = createMixedLocationMockProvider()

        render(
            <StatefulAddressInput
                preferredLocation={() => ({ city: 'Cheshire', state: 'Connecticut', country: 'United States' })}
                provider={provider}
            />,
        )

        await user.type(screen.getByLabelText('Address'), '327')

        const [firstOption] = await screen.findAllByRole('option')

        expect(firstOption).toBeDefined()
        expect(firstOption?.textContent).toContain('Cheshire, CT, USA')
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

    it('allows selected address to define the next input value', async () => {
        const user = userEvent.setup()
        const provider = createMockProvider()

        render(
            <StatefulAddressInput
                getSelectedAddressInputValue={(selectedAddress) => selectedAddress.addressLine1}
                provider={provider}
            />,
        )

        const input = screen.getByLabelText('Address') as HTMLInputElement
        await user.type(input, '13133')
        await user.click(await screen.findByRole('option', { name: /13133 34th Street North/i }))

        await waitFor(() => {
            expect(input.value).toBe('13133 34th Street North')
        })
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

    it('keeps the typed query in the input while highlighting suggestions by default', async () => {
        const user = userEvent.setup()
        const provider = createTwoSuggestionMockProvider()

        render(<StatefulAddressInput provider={provider} />)

        const input = screen.getByLabelText('Address') as HTMLInputElement
        await user.type(input, '13133')
        await screen.findByRole('option', { name: /13133 34th Street North/i })
        await user.keyboard('{ArrowDown}')

        expect(input.value).toBe('13133')
    })

    it('can preview the highlighted suggestion in the input during keyboard navigation', async () => {
        const user = userEvent.setup()
        const provider = createTwoSuggestionMockProvider()

        render(<StatefulAddressInput previewHighlightedSuggestion provider={provider} />)

        const input = screen.getByLabelText('Address') as HTMLInputElement
        await user.type(input, '13133')
        await screen.findByRole('option', { name: /13133 34th Street North/i })
        await user.keyboard('{ArrowDown}')

        expect(input.value).toBe('13133 USF Laurel Drive, Tampa, FL, USA')
    })

    it('supports custom highlighted suggestion preview text', async () => {
        const user = userEvent.setup()
        const provider = createTwoSuggestionMockProvider()

        render(
            <StatefulAddressInput
                previewHighlightedSuggestion
                getHighlightedSuggestionInputValue={(suggestion) => suggestion.mainText}
                provider={provider}
            />,
        )

        const input = screen.getByLabelText('Address') as HTMLInputElement
        await user.type(input, '13133')
        await screen.findByRole('option', { name: /13133 34th Street North/i })
        await user.keyboard('{ArrowDown}')

        expect(input.value).toBe('13133 USF Laurel Drive')
    })

    it('renders the dropdown through document.body when dropdownPortal is enabled', async () => {
        const user = userEvent.setup()
        const provider = createMockProvider()
        const { container } = render(<StatefulAddressInput dropdownPortal provider={provider} />)

        const input = screen.getByLabelText('Address')
        await user.type(input, '13133')

        const listbox = await screen.findByRole('listbox')
        expect(document.body.contains(listbox)).toBe(true)
        expect(container.contains(listbox)).toBe(false)
    })

    it('connects combobox aria attributes to the highlighted option', async () => {
        const user = userEvent.setup()
        const provider = createMockProvider()

        render(<StatefulAddressInput provider={provider} />)

        const input = screen.getByLabelText('Address')
        await user.type(input, '13133')

        const listbox = await screen.findByRole('listbox')
        const option = await screen.findByRole('option', { name: /13133 34th Street North/i })

        expect(input.getAttribute('aria-expanded')).toBe('true')
        expect(input.getAttribute('aria-controls')).toBe(listbox.id)
        expect(input.getAttribute('aria-activedescendant')).toBe(option.id)
        expect(option.getAttribute('aria-selected')).toBe('true')
    })
})
