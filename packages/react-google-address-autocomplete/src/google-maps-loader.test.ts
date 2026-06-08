import { afterEach, describe, expect, it, vi } from 'vitest'

import { loadGoogleMapsJavaScriptApi, resetGoogleMapsLoaderForTests } from './google-maps-loader'

describe('loadGoogleMapsJavaScriptApi', () => {
    afterEach(() => {
        resetGoogleMapsLoaderForTests()
        document.head.innerHTML = ''
        delete window.google
    })

    it('returns an already loaded Google Maps global', async () => {
        const google = { maps: { importLibrary: vi.fn() } }
        window.google = google

        await expect(loadGoogleMapsJavaScriptApi({ apiKey: 'test-key' })).resolves.toBe(google)
        expect(document.querySelector('script')).toBeNull()
    })

    it('injects the Google Maps JavaScript API script and resolves through the callback', async () => {
        const promise = loadGoogleMapsJavaScriptApi({
            apiKey: 'test-key',
            language: 'en',
            region: 'US',
            authReferrerPolicy: 'origin',
            mapIds: ['map-id-1'],
        })
        const script = document.querySelector<HTMLScriptElement>('#rgac-google-maps-js')

        expect(script).not.toBeNull()

        if (!script) {
            throw new Error('Expected Google Maps script to be injected.')
        }

        const scriptUrl = new URL(script.src)
        expect(scriptUrl.searchParams.get('key')).toBe('test-key')
        expect(scriptUrl.searchParams.get('v')).toBe('weekly')
        expect(scriptUrl.searchParams.get('libraries')).toBe('places')
        expect(scriptUrl.searchParams.get('callback')).toBe('__rgacGoogleMapsInit')
        expect(scriptUrl.searchParams.get('language')).toBe('en')
        expect(scriptUrl.searchParams.get('region')).toBe('US')
        expect(scriptUrl.searchParams.get('auth_referrer_policy')).toBe('origin')
        expect(scriptUrl.searchParams.get('map_ids')).toBe('map-id-1')

        const google = { maps: { importLibrary: vi.fn() } }
        window.google = google
        window.__rgacGoogleMapsInit?.()

        await expect(promise).resolves.toBe(google)
    })
})
