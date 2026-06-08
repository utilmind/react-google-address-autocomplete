import { parseGooglePlaceAddress, type GooglePlaceAddressLike } from './google-address-parser'
import {
    loadGoogleMapsJavaScriptApi,
    type GoogleMapsGlobalLike,
    type GoogleMapsLoaderOptions,
} from './google-maps-loader'
import type {
    AddressAutocompleteProvider,
    AddressAutocompleteRequestOptions,
    AddressSuggestion,
    SelectedAddress,
} from './types'

type GoogleAutocompleteSessionTokenLike = object

interface GoogleStringRangeLike {
    startOffset?: number
    endOffset?: number
}

interface GoogleFormattableTextLike {
    text?: string
    matches?: readonly GoogleStringRangeLike[]
    toString?: () => string
}

interface GooglePlaceLike extends GooglePlaceAddressLike {
    fetchFields?: (request: { fields: readonly string[] }) => Promise<unknown>
}

interface GooglePlacePredictionLike {
    placeId?: string
    mainText?: GoogleFormattableTextLike
    secondaryText?: GoogleFormattableTextLike
    text?: GoogleFormattableTextLike
    distanceMeters?: number
    types?: readonly string[]
    toPlace?: () => GooglePlaceLike
}

interface GoogleAutocompleteSuggestionLike {
    placePrediction?: GooglePlacePredictionLike
}

interface GooglePlacesLibraryLike {
    AutocompleteSessionToken: new () => GoogleAutocompleteSessionTokenLike
    AutocompleteSuggestion: {
        fetchAutocompleteSuggestions: (request: GoogleAutocompleteRequestLike) => Promise<{
            suggestions?: readonly GoogleAutocompleteSuggestionLike[]
        }>
    }
}

interface GoogleAutocompleteRequestLike {
    input: string
    sessionToken: GoogleAutocompleteSessionTokenLike
    includedRegionCodes?: readonly string[]
    includedPrimaryTypes?: readonly string[]
    language?: string
    region?: string
    locationBias?: unknown
    locationRestriction?: unknown
    origin?: { lat: number; lng: number }
}

interface TextWithMatches {
    text: string
    matches: readonly { startOffset: number; endOffset: number }[]
}

export interface GooglePlacesAutocompleteProviderOptions {
    apiKey: string
    defaultRequestOptions?: AddressAutocompleteRequestOptions
    placeFields?: readonly string[]
    loaderOptions?: Omit<GoogleMapsLoaderOptions, 'apiKey' | 'language' | 'region'>
    loadGoogleMaps?: () => Promise<GoogleMapsGlobalLike>
    ignoreOutdatedResponses?: boolean
}

const defaultPlaceFields = ['id', 'formattedAddress', 'addressComponents', 'location'] as const

export function createGooglePlacesAutocompleteProvider(
    options: GooglePlacesAutocompleteProviderOptions,
): AddressAutocompleteProvider {
    let placesLibraryPromise: Promise<GooglePlacesLibraryLike> | null = null
    let sessionToken: GoogleAutocompleteSessionTokenLike | null = null
    let latestRequestId = 0
    const predictionByPlaceId = new Map<string, GooglePlacePredictionLike>()
    const ignoreOutdatedResponses = options.ignoreOutdatedResponses ?? true

    const provider: AddressAutocompleteProvider = {
        async getSuggestions(query, requestOptions) {
            const input = query.trim()

            if (!input) {
                predictionByPlaceId.clear()
                return []
            }

            const places = await getPlacesLibrary()
            const requestId = ++latestRequestId
            const effectiveOptions = mergeRequestOptions(options.defaultRequestOptions, requestOptions)
            const response = await places.AutocompleteSuggestion.fetchAutocompleteSuggestions({
                input,
                sessionToken: getSessionToken(places),
                ...toGoogleAutocompleteRequestOptions(effectiveOptions),
            })

            if (ignoreOutdatedResponses && requestId !== latestRequestId) {
                return []
            }

            predictionByPlaceId.clear()

            return (response.suggestions ?? [])
                .map((suggestion) => suggestion.placePrediction)
                .filter(isPlacePrediction)
                .map((prediction) => {
                    const suggestion = normalizePlacePrediction(prediction)
                    predictionByPlaceId.set(suggestion.placeId, prediction)
                    return suggestion
                })
        },

        async selectSuggestion(suggestion) {
            const prediction = predictionByPlaceId.get(suggestion.placeId)

            if (!prediction) {
                throw new Error(
                    'Selected address suggestion is no longer available. ' +
                        'Call getSuggestions() again before selecting it.',
                )
            }

            const selectedAddress = await fetchSelectedAddressForPrediction(prediction)

            provider.resetSession?.()

            return selectedAddress
        },

        async lookupAddress(query, requestOptions): Promise<SelectedAddress | null> {
            const input = query.trim()

            if (!input) {
                return null
            }

            const places = await getPlacesLibrary()
            const effectiveOptions = mergeRequestOptions(options.defaultRequestOptions, requestOptions)
            const response = await places.AutocompleteSuggestion.fetchAutocompleteSuggestions({
                input,
                sessionToken: new places.AutocompleteSessionToken(),
                ...toGoogleAutocompleteRequestOptions(effectiveOptions),
            })
            const prediction = (response.suggestions ?? [])
                .map((suggestion) => suggestion.placePrediction)
                .find(isPlacePrediction)

            return prediction ? fetchSelectedAddressForPrediction(prediction) : null
        },

        resetSession() {
            sessionToken = null
            predictionByPlaceId.clear()
        },
    }

    return provider

    async function getPlacesLibrary(): Promise<GooglePlacesLibraryLike> {
        placesLibraryPromise ??= loadPlacesLibrary(options)
        return placesLibraryPromise
    }

    async function fetchSelectedAddressForPrediction(prediction: GooglePlacePredictionLike): Promise<SelectedAddress> {
        if (!prediction.toPlace) {
            throw new Error('Google PlacePrediction.toPlace() is unavailable for the selected suggestion.')
        }

        const place = prediction.toPlace()
        const fields = options.placeFields ?? defaultPlaceFields
        const fetchResult = await place.fetchFields?.({ fields })
        const hydratedPlace = getHydratedPlace(fetchResult) ?? place

        return parseGooglePlaceAddress(hydratedPlace)
    }

    function getSessionToken(places: GooglePlacesLibraryLike): GoogleAutocompleteSessionTokenLike {
        sessionToken ??= new places.AutocompleteSessionToken()
        return sessionToken
    }
}

async function loadPlacesLibrary(options: GooglePlacesAutocompleteProviderOptions): Promise<GooglePlacesLibraryLike> {
    const google = options.loadGoogleMaps
        ? await options.loadGoogleMaps()
        : await loadGoogleMapsJavaScriptApi({
              apiKey: options.apiKey,
              language: options.defaultRequestOptions?.language,
              region: options.defaultRequestOptions?.region,
              ...options.loaderOptions,
          })

    if (!google.maps.importLibrary) {
        throw new Error('google.maps.importLibrary() is unavailable. Load a recent Google Maps JavaScript API version.')
    }

    const placesLibrary = await google.maps.importLibrary('places')

    if (!isGooglePlacesLibrary(placesLibrary)) {
        throw new Error('Google Maps Places library did not expose the expected Autocomplete Data API classes.')
    }

    return placesLibrary
}

function toGoogleAutocompleteRequestOptions(
    options: AddressAutocompleteRequestOptions,
): Omit<GoogleAutocompleteRequestLike, 'input' | 'sessionToken'> {
    return removeUndefinedValues({
        includedRegionCodes: options.countryCodes,
        includedPrimaryTypes: options.includedPrimaryTypes,
        language: options.language,
        region: options.region,
        locationBias: options.locationBias,
        locationRestriction: options.locationRestriction,
        origin: options.origin,
    })
}

function mergeRequestOptions(
    defaults: AddressAutocompleteRequestOptions | undefined,
    overrides: AddressAutocompleteRequestOptions | undefined,
): AddressAutocompleteRequestOptions {
    return {
        ...(defaults ?? {}),
        ...removeUndefinedValues({
            countryCodes: overrides?.countryCodes,
            includedPrimaryTypes: overrides?.includedPrimaryTypes,
            language: overrides?.language,
            region: overrides?.region,
            locationBias: overrides?.locationBias,
            locationRestriction: overrides?.locationRestriction,
            origin: overrides?.origin,
        }),
    }
}

function normalizePlacePrediction(prediction: GooglePlacePredictionLike): AddressSuggestion {
    const mainText = getTextWithMatches(prediction.mainText)
    const secondaryText = getTextWithMatches(prediction.secondaryText)
    const fullText = getTextWithMatches(prediction.text)
    const fallbackFullText = [mainText.text, secondaryText.text].filter(Boolean).join(', ')

    return {
        placeId: prediction.placeId ?? '',
        mainText: mainText.text,
        secondaryText: secondaryText.text,
        fullText: fullText.text || fallbackFullText,
        mainTextMatches: mainText.matches,
        fullTextMatches: fullText.matches,
        distanceMeters: prediction.distanceMeters,
        types: prediction.types ?? [],
    }
}

function getTextWithMatches(value: GoogleFormattableTextLike | undefined): TextWithMatches {
    return {
        text: getFormattableText(value),
        matches: (value?.matches ?? []).map((match) => ({
            startOffset: match.startOffset ?? 0,
            endOffset: match.endOffset ?? 0,
        })),
    }
}

function getFormattableText(value: GoogleFormattableTextLike | undefined): string {
    if (!value) {
        return ''
    }

    if (typeof value.text === 'string') {
        return value.text
    }

    const fallback = value.toString?.()
    return fallback && fallback !== '[object Object]' ? fallback : ''
}

function isPlacePrediction(prediction: GooglePlacePredictionLike | undefined): prediction is GooglePlacePredictionLike {
    return Boolean(prediction?.placeId)
}

function isGooglePlacesLibrary(value: unknown): value is GooglePlacesLibraryLike {
    const library = value as Partial<GooglePlacesLibraryLike> | null

    return (
        typeof library?.AutocompleteSessionToken === 'function' &&
        typeof library.AutocompleteSuggestion?.fetchAutocompleteSuggestions === 'function'
    )
}

function getHydratedPlace(fetchResult: unknown): GooglePlaceLike | null {
    if (!fetchResult || typeof fetchResult !== 'object') {
        return null
    }

    const place = (fetchResult as { place?: GooglePlaceLike }).place
    return place && typeof place === 'object' ? place : null
}

function removeUndefinedValues<T extends Record<string, unknown>>(value: T): T {
    return Object.fromEntries(Object.entries(value).filter(([, entryValue]) => entryValue !== undefined)) as T
}
