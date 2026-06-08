export interface GoogleMapsGlobalLike {
    maps: {
        importLibrary?: (name: string) => Promise<unknown>
    }
}

declare global {
    interface Window {
        google?: GoogleMapsGlobalLike
        __rgacGoogleMapsInit?: () => void
    }
}

export interface GoogleMapsLoaderOptions {
    apiKey: string
    version?: string
    language?: string
    region?: string
    authReferrerPolicy?: 'origin'
    mapIds?: readonly string[]
    nonce?: string
    scriptId?: string
    url?: string
}

const defaultScriptId = 'rgac-google-maps-js'
const defaultGoogleMapsUrl = 'https://maps.googleapis.com/maps/api/js'
const callbackName = '__rgacGoogleMapsInit'

let activeLoadPromise: Promise<GoogleMapsGlobalLike> | null = null
let activeLoadKey = ''

export function getGoogleMapsGlobal(): GoogleMapsGlobalLike | undefined {
    return globalThis.window?.google
}

export function loadGoogleMapsJavaScriptApi(options: GoogleMapsLoaderOptions): Promise<GoogleMapsGlobalLike> {
    const existingGoogle = getGoogleMapsGlobal()

    if (existingGoogle?.maps) {
        return Promise.resolve(existingGoogle)
    }

    if (!options.apiKey.trim()) {
        return Promise.reject(new Error('Google Maps JavaScript API key is required.'))
    }

    if (typeof document === 'undefined') {
        return Promise.reject(new Error('Google Maps JavaScript API can only be loaded in a browser environment.'))
    }

    const loadKey = createLoadKey(options)

    if (activeLoadPromise && activeLoadKey === loadKey) {
        return activeLoadPromise
    }

    if (activeLoadPromise && activeLoadKey !== loadKey) {
        return Promise.reject(
            new Error(
                'Google Maps JavaScript API is already loading with different options. Reload the page to change it.',
            ),
        )
    }

    const existingScript = document.getElementById(options.scriptId ?? defaultScriptId) as HTMLScriptElement | null

    if (existingScript) {
        activeLoadKey = loadKey
        activeLoadPromise = waitForExistingGoogleMapsScript(existingScript)
        return activeLoadPromise
    }

    activeLoadKey = loadKey
    activeLoadPromise = injectGoogleMapsScript(options)

    return activeLoadPromise
}

export function resetGoogleMapsLoaderForTests() {
    activeLoadPromise = null
    activeLoadKey = ''

    if (globalThis.window) {
        delete window.__rgacGoogleMapsInit
    }
}

function injectGoogleMapsScript(options: GoogleMapsLoaderOptions): Promise<GoogleMapsGlobalLike> {
    return new Promise((resolve, reject) => {
        const script = document.createElement('script')

        script.id = options.scriptId ?? defaultScriptId
        script.src = createGoogleMapsScriptUrl(options)
        script.async = true
        script.defer = true

        if (options.nonce) {
            script.nonce = options.nonce
        }

        script.onerror = () => {
            cleanupScriptCallback()
            activeLoadPromise = null
            activeLoadKey = ''
            reject(new Error('Failed to load the Google Maps JavaScript API script.'))
        }

        window[callbackName] = () => {
            const google = getGoogleMapsGlobal()
            cleanupScriptCallback()

            if (!google?.maps) {
                activeLoadPromise = null
                activeLoadKey = ''
                reject(new Error('Google Maps JavaScript API loaded, but window.google.maps is unavailable.'))
                return
            }

            resolve(google)
        }

        document.head.appendChild(script)
    })
}

function waitForExistingGoogleMapsScript(script: HTMLScriptElement): Promise<GoogleMapsGlobalLike> {
    return new Promise((resolve, reject) => {
        const existingGoogle = getGoogleMapsGlobal()

        if (existingGoogle?.maps) {
            resolve(existingGoogle)
            return
        }

        const previousOnload = script.onload
        const previousOnerror = script.onerror

        script.onload = (event) => {
            if (typeof previousOnload === 'function') {
                previousOnload.call(script, event)
            }

            const google = getGoogleMapsGlobal()

            if (google?.maps) {
                resolve(google)
                return
            }

            reject(new Error('Google Maps JavaScript API script loaded, but window.google.maps is unavailable.'))
        }

        script.onerror = (event, source, lineno, colno, error) => {
            if (typeof previousOnerror === 'function') {
                previousOnerror.call(script, event, source, lineno, colno, error)
            }

            activeLoadPromise = null
            activeLoadKey = ''
            reject(new Error('Failed to load the existing Google Maps JavaScript API script.'))
        }
    })
}

function createGoogleMapsScriptUrl(options: GoogleMapsLoaderOptions): string {
    const url = new URL(options.url ?? defaultGoogleMapsUrl)

    url.searchParams.set('key', options.apiKey)
    url.searchParams.set('v', options.version ?? 'weekly')
    url.searchParams.set('libraries', 'places')
    url.searchParams.set('callback', callbackName)

    if (options.language) {
        url.searchParams.set('language', options.language)
    }

    if (options.region) {
        url.searchParams.set('region', options.region)
    }

    if (options.authReferrerPolicy) {
        url.searchParams.set('auth_referrer_policy', options.authReferrerPolicy)
    }

    if (options.mapIds?.length) {
        url.searchParams.set('map_ids', options.mapIds.join(','))
    }

    return url.toString()
}

function createLoadKey(options: GoogleMapsLoaderOptions): string {
    return JSON.stringify({
        apiKey: options.apiKey,
        version: options.version ?? 'weekly',
        language: options.language ?? '',
        region: options.region ?? '',
        authReferrerPolicy: options.authReferrerPolicy ?? '',
        mapIds: options.mapIds ?? [],
        scriptId: options.scriptId ?? defaultScriptId,
        url: options.url ?? defaultGoogleMapsUrl,
    })
}

function cleanupScriptCallback() {
    delete window[callbackName]
}
