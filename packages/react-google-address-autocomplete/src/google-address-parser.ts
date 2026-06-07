import type { SelectedAddress } from './types'

export interface GoogleAddressComponentLike {
    longText?: string | null
    shortText?: string | null
    long_name?: string | null
    short_name?: string | null
    types?: readonly string[] | null
}

export interface GoogleLatLngLike {
    lat?: number | (() => number)
    lng?: number | (() => number)
    toJSON?: () => { lat?: number; lng?: number }
}

export interface GooglePlaceAddressLike {
    id?: string | null
    placeId?: string | null
    formattedAddress?: string | null
    formatted_address?: string | null
    addressComponents?: readonly GoogleAddressComponentLike[] | null
    address_components?: readonly GoogleAddressComponentLike[] | null
    location?: GoogleLatLngLike | null
    geometry?: {
        location?: GoogleLatLngLike | null
    } | null
}

interface ComponentValue {
    longText: string
    shortText: string
}

export function parseGooglePlaceAddress(place: GooglePlaceAddressLike): SelectedAddress {
    const components = getAddressComponents(place)
    const streetNumber = getComponentValue(components, 'street_number')
    const route = getComponentValue(components, 'route')
    const subpremise = getComponentValue(components, 'subpremise')
    const postalCode = getComponentValue(components, 'postal_code')
    const postalCodeSuffix = getComponentValue(components, 'postal_code_suffix')
    const state = getComponentValue(components, 'administrative_area_level_1')
    const country = getComponentValue(components, 'country')
    const coordinates = getCoordinates(place)

    return {
        placeId: place.id ?? place.placeId ?? '',
        formattedAddress: place.formattedAddress ?? place.formatted_address ?? '',
        addressLine1: joinNonEmpty([streetNumber.longText, route.longText], ' '),
        addressLine2: subpremise.longText,
        city: getCity(components),
        state: state.longText,
        stateCode: state.shortText,
        postalCode: postalCode.longText,
        postalCodeSuffix: postalCodeSuffix.longText,
        country: country.longText,
        countryCode: country.shortText,
        latitude: coordinates.latitude,
        longitude: coordinates.longitude,
        rawPlace: place,
    }
}

export function getAddressComponent(
    components: readonly GoogleAddressComponentLike[] | null | undefined,
    type: string,
): GoogleAddressComponentLike | undefined {
    return components?.find((component) => component.types?.includes(type))
}

function getAddressComponents(place: GooglePlaceAddressLike): readonly GoogleAddressComponentLike[] {
    return place.addressComponents ?? place.address_components ?? []
}

function getCity(components: readonly GoogleAddressComponentLike[]): string {
    return (
        getComponentValue(components, 'locality').longText ||
        getComponentValue(components, 'postal_town').longText ||
        getComponentValue(components, 'sublocality_level_1').longText ||
        getComponentValue(components, 'administrative_area_level_3').longText ||
        getComponentValue(components, 'administrative_area_level_2').longText
    )
}

function getComponentValue(components: readonly GoogleAddressComponentLike[], type: string): ComponentValue {
    const component = getAddressComponent(components, type)

    return {
        longText: component?.longText ?? component?.long_name ?? '',
        shortText: component?.shortText ?? component?.short_name ?? '',
    }
}

function getCoordinates(place: GooglePlaceAddressLike): Pick<SelectedAddress, 'latitude' | 'longitude'> {
    const location = place.location ?? place.geometry?.location

    if (!location) {
        return { latitude: null, longitude: null }
    }

    const jsonLocation = location.toJSON?.()
    const rawLat = jsonLocation?.lat ?? location.lat
    const rawLng = jsonLocation?.lng ?? location.lng
    const latitude = typeof rawLat === 'function' ? rawLat() : rawLat
    const longitude = typeof rawLng === 'function' ? rawLng() : rawLng

    return {
        latitude: typeof latitude === 'number' && Number.isFinite(latitude) ? latitude : null,
        longitude: typeof longitude === 'number' && Number.isFinite(longitude) ? longitude : null,
    }
}

function joinNonEmpty(parts: readonly string[], separator: string): string {
    return parts.filter(Boolean).join(separator)
}
