import { beforeEach, describe, expect, it, vi } from 'vitest'

import { createGooglePlacesAutocompleteProvider } from './google-places-provider'
import type { AddressSuggestion } from './types'

class MockAutocompleteSessionToken {
    static nextId = 1

    readonly id = MockAutocompleteSessionToken.nextId++
}

function createDeferred<T>() {
    let resolve!: (value: T) => void
    let reject!: (reason?: unknown) => void
    const promise = new Promise<T>((promiseResolve, promiseReject) => {
        resolve = promiseResolve
        reject = promiseReject
    })

    return { promise, resolve, reject }
}

describe('createGooglePlacesAutocompleteProvider', () => {
    beforeEach(() => {
        MockAutocompleteSessionToken.nextId = 1
    })

    it('fetches and normalizes Google place predictions', async () => {
        const fetchAutocompleteSuggestions = vi.fn().mockResolvedValue({
            suggestions: [
                {
                    placePrediction: {
                        placeId: 'place-1',
                        mainText: {
                            text: '13133 34th Street North',
                            matches: [{ startOffset: 0, endOffset: 5 }],
                        },
                        secondaryText: { text: 'Clearwater, FL, USA' },
                        text: {
                            text: '13133 34th Street North, Clearwater, FL, USA',
                            matches: [{ startOffset: 0, endOffset: 5 }],
                        },
                        distanceMeters: 123,
                        types: ['street_address'],
                    },
                },
            ],
        })
        const importLibrary = vi.fn().mockResolvedValue({
            AutocompleteSessionToken: MockAutocompleteSessionToken,
            AutocompleteSuggestion: { fetchAutocompleteSuggestions },
        })
        const provider = createGooglePlacesAutocompleteProvider({
            apiKey: 'test-key',
            defaultRequestOptions: {
                countryCodes: ['US'],
                includedPrimaryTypes: ['street_address'],
                language: 'en',
                region: 'US',
                origin: { lat: 27.9659, lng: -82.8001 },
            },
            loadGoogleMaps: async () => ({ maps: { importLibrary } }),
        })

        const suggestions = await provider.getSuggestions('13133')

        expect(importLibrary).toHaveBeenCalledWith('places')
        expect(fetchAutocompleteSuggestions).toHaveBeenCalledWith(
            expect.objectContaining({
                input: '13133',
                includedRegionCodes: ['US'],
                includedPrimaryTypes: ['street_address'],
                language: 'en',
                region: 'US',
                origin: { lat: 27.9659, lng: -82.8001 },
            }),
        )
        expect(suggestions).toEqual([
            {
                placeId: 'place-1',
                mainText: '13133 34th Street North',
                secondaryText: 'Clearwater, FL, USA',
                fullText: '13133 34th Street North, Clearwater, FL, USA',
                mainTextMatches: [{ startOffset: 0, endOffset: 5 }],
                fullTextMatches: [{ startOffset: 0, endOffset: 5 }],
                distanceMeters: 123,
                types: ['street_address'],
            },
        ])
    })

    it('keeps provider defaults when component-level request options are undefined', async () => {
        const fetchAutocompleteSuggestions = vi.fn().mockResolvedValue({ suggestions: [] })
        const importLibrary = vi.fn().mockResolvedValue({
            AutocompleteSessionToken: MockAutocompleteSessionToken,
            AutocompleteSuggestion: { fetchAutocompleteSuggestions },
        })
        const provider = createGooglePlacesAutocompleteProvider({
            apiKey: 'test-key',
            defaultRequestOptions: {
                countryCodes: ['US'],
                language: 'en',
                region: 'US',
            },
            loadGoogleMaps: async () => ({ maps: { importLibrary } }),
        })

        await provider.getSuggestions('13133', {
            countryCodes: undefined,
            language: undefined,
            region: undefined,
        })

        expect(fetchAutocompleteSuggestions).toHaveBeenCalledWith(
            expect.objectContaining({
                includedRegionCodes: ['US'],
                language: 'en',
                region: 'US',
            }),
        )
    })

    it('uses the cached place prediction to fetch selected place details and reset the session', async () => {
        const place = {
            id: 'place-1',
            formattedAddress: '13133 34th Street North, Clearwater, FL 33762, USA',
            addressComponents: [
                { longText: '13133', shortText: '13133', types: ['street_number'] },
                { longText: '34th Street North', shortText: '34th St N', types: ['route'] },
                { longText: 'Clearwater', shortText: 'Clearwater', types: ['locality'] },
                { longText: 'Florida', shortText: 'FL', types: ['administrative_area_level_1'] },
                { longText: '33762', shortText: '33762', types: ['postal_code'] },
                { longText: 'United States', shortText: 'US', types: ['country'] },
            ],
            location: { lat: 27.8932, lng: -82.6779 },
            fetchFields: vi.fn().mockResolvedValue(undefined),
        }
        const toPlace = vi.fn(() => place)
        const fetchAutocompleteSuggestions = vi.fn().mockResolvedValue({
            suggestions: [
                {
                    placePrediction: {
                        placeId: 'place-1',
                        mainText: { text: '13133 34th Street North' },
                        secondaryText: { text: 'Clearwater, FL, USA' },
                        text: { text: '13133 34th Street North, Clearwater, FL, USA' },
                        toPlace,
                    },
                },
            ],
        })
        const importLibrary = vi.fn().mockResolvedValue({
            AutocompleteSessionToken: MockAutocompleteSessionToken,
            AutocompleteSuggestion: { fetchAutocompleteSuggestions },
        })
        const provider = createGooglePlacesAutocompleteProvider({
            apiKey: 'test-key',
            loadGoogleMaps: async () => ({ maps: { importLibrary } }),
        })

        const [suggestion] = await provider.getSuggestions('13133')
        const firstToken = fetchAutocompleteSuggestions.mock.calls[0]?.[0].sessionToken
        const selectedAddress = await provider.selectSuggestion(suggestion as AddressSuggestion)
        await provider.getSuggestions('13134')
        const secondToken = fetchAutocompleteSuggestions.mock.calls[1]?.[0].sessionToken

        expect(toPlace).toHaveBeenCalledTimes(1)
        expect(place.fetchFields).toHaveBeenCalledWith({
            fields: ['id', 'formattedAddress', 'addressComponents', 'location'],
        })
        expect(selectedAddress).toMatchObject({
            placeId: 'place-1',
            formattedAddress: '13133 34th Street North, Clearwater, FL 33762, USA',
            addressLine1: '13133 34th Street North',
            city: 'Clearwater',
            stateCode: 'FL',
            postalCode: '33762',
            latitude: 27.8932,
            longitude: -82.6779,
        })
        expect(secondToken).not.toBe(firstToken)
    })

    it('returns an empty result for outdated autocomplete responses', async () => {
        const firstRequest = createDeferred<{
            suggestions: Array<{
                placePrediction: {
                    placeId: string
                    mainText: { text: string }
                    text: { text: string }
                }
            }>
        }>()
        const secondRequest = createDeferred<{ suggestions: [] }>()
        const fetchAutocompleteSuggestions = vi
            .fn()
            .mockReturnValueOnce(firstRequest.promise)
            .mockReturnValueOnce(secondRequest.promise)
        const importLibrary = vi.fn().mockResolvedValue({
            AutocompleteSessionToken: MockAutocompleteSessionToken,
            AutocompleteSuggestion: { fetchAutocompleteSuggestions },
        })
        const provider = createGooglePlacesAutocompleteProvider({
            apiKey: 'test-key',
            loadGoogleMaps: async () => ({ maps: { importLibrary } }),
        })

        const stalePromise = provider.getSuggestions('131')
        const latestPromise = provider.getSuggestions('13133')

        secondRequest.resolve({ suggestions: [] })
        await expect(latestPromise).resolves.toEqual([])

        firstRequest.resolve({
            suggestions: [
                {
                    placePrediction: {
                        placeId: 'stale-place',
                        mainText: { text: 'Stale address' },
                        text: { text: 'Stale address' },
                    },
                },
            ],
        })
        await expect(stalePromise).resolves.toEqual([])
    })
})
