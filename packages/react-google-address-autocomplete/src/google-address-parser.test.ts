import { describe, expect, it } from 'vitest'

import { parseGooglePlaceAddress } from './google-address-parser'

const component = (longText: string, shortText: string, types: readonly string[]) => ({ longText, shortText, types })

describe('parseGooglePlaceAddress', () => {
    it('parses a US street address with state code, postal code, and coordinates', () => {
        const result = parseGooglePlaceAddress({
            id: 'place-123',
            formattedAddress: '13133 34th Street North, Clearwater, FL 33762, USA',
            addressComponents: [
                component('13133', '13133', ['street_number']),
                component('34th Street North', '34th St N', ['route']),
                component('Clearwater', 'Clearwater', ['locality']),
                component('Pinellas County', 'Pinellas County', ['administrative_area_level_2']),
                component('Florida', 'FL', ['administrative_area_level_1']),
                component('33762', '33762', ['postal_code']),
                component('United States', 'US', ['country']),
            ],
            location: { lat: 27.8948, lng: -82.6781 },
        })

        expect(result).toMatchObject({
            placeId: 'place-123',
            formattedAddress: '13133 34th Street North, Clearwater, FL 33762, USA',
            addressLine1: '13133 34th Street North',
            addressLine2: '',
            city: 'Clearwater',
            state: 'Florida',
            stateCode: 'FL',
            postalCode: '33762',
            country: 'United States',
            countryCode: 'US',
            latitude: 27.8948,
            longitude: -82.6781,
        })
    })

    it('keeps route-only addresses usable when Google omits a street number', () => {
        const result = parseGooglePlaceAddress({
            placeId: 'route-only',
            formattedAddress: '34th Street North, St. Petersburg, FL, USA',
            addressComponents: [
                component('34th Street North', '34th St N', ['route']),
                component('St. Petersburg', 'St. Petersburg', ['locality']),
                component('Florida', 'FL', ['administrative_area_level_1']),
                component('United States', 'US', ['country']),
            ],
        })

        expect(result.addressLine1).toBe('34th Street North')
        expect(result.city).toBe('St. Petersburg')
        expect(result.latitude).toBeNull()
        expect(result.longitude).toBeNull()
    })

    it('parses ZIP+4 as separate postal code and suffix fields', () => {
        const result = parseGooglePlaceAddress({
            formattedAddress: '1600 Pennsylvania Avenue NW, Washington, DC 20500-0003, USA',
            addressComponents: [
                component('1600', '1600', ['street_number']),
                component('Pennsylvania Avenue Northwest', 'Pennsylvania Ave NW', ['route']),
                component('Washington', 'Washington', ['locality']),
                component('District of Columbia', 'DC', ['administrative_area_level_1']),
                component('20500', '20500', ['postal_code']),
                component('0003', '0003', ['postal_code_suffix']),
                component('United States', 'US', ['country']),
            ],
            location: {
                toJSON: () => ({ lat: 38.8977, lng: -77.0365 }),
            },
        })

        expect(result.postalCode).toBe('20500')
        expect(result.postalCodeSuffix).toBe('0003')
        expect(result.latitude).toBe(38.8977)
        expect(result.longitude).toBe(-77.0365)
    })

    it('falls back to postal town for non-US addresses', () => {
        const result = parseGooglePlaceAddress({
            id: 'uk-place',
            formattedAddress: '10 Downing Street, London SW1A 2AA, UK',
            addressComponents: [
                component('10', '10', ['street_number']),
                component('Downing Street', 'Downing St', ['route']),
                component('London', 'London', ['postal_town']),
                component('England', 'England', ['administrative_area_level_1']),
                component('SW1A 2AA', 'SW1A 2AA', ['postal_code']),
                component('United Kingdom', 'GB', ['country']),
            ],
            location: {
                lat: () => 51.5034,
                lng: () => -0.1276,
            },
        })

        expect(result).toMatchObject({
            addressLine1: '10 Downing Street',
            city: 'London',
            state: 'England',
            stateCode: 'England',
            postalCode: 'SW1A 2AA',
            country: 'United Kingdom',
            countryCode: 'GB',
            latitude: 51.5034,
            longitude: -0.1276,
        })
    })
})
