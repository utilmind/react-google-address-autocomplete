import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react'
import type { ChangeEventHandler, FocusEventHandler, KeyboardEventHandler, ReactNode } from 'react'
import { createPortal } from 'react-dom'

import type {
    AddressAutocompleteInputProps,
    AddressAutocompleteRequestOptions,
    AddressAutocompleteSlotState,
    AddressAutocompleteStatus,
    AddressSuggestion,
    AddressTextMatch,
} from './types'

const defaultDebounceMs = 250
const defaultMaxSuggestions = 5
const defaultMinQueryLength = 1
const defaultDropdownPortalOffset = 6
const defaultAutoComplete = 'one-time-code'
const defaultInputNamePrefix = 'rgac-address-search'

interface DropdownPosition {
    left: number
    top: number
    width: number
}

export function AddressAutocompleteInput(props: AddressAutocompleteInputProps) {
    const {
        id,
        value,
        onValueChange,
        label,
        className,
        inputClassName,
        dropdownClassName,
        dropdownStyle,
        suggestionClassName,
        highlightedSuggestionClassName,
        statusMessageClassName,
        provider,
        minQueryLength = defaultMinQueryLength,
        debounceMs = defaultDebounceMs,
        maxSuggestions = defaultMaxSuggestions,
        countryCodes,
        includedPrimaryTypes,
        language,
        region,
        locationBias,
        locationRestriction,
        origin,
        onAddressSelect,
        getSelectedAddressInputValue,
        previewHighlightedSuggestion = false,
        getHighlightedSuggestionInputValue,
        renderSuggestion,
        showLoading = false,
        loadingText = 'Loading…',
        renderLoading,
        renderEmpty,
        renderError,
        dropdownPortal = false,
        dropdownPortalContainer,
        dropdownPortalOffset = defaultDropdownPortalOffset,
        onBlur,
        onFocus,
        onKeyDown,
        disabled,
        readOnly,
        autoComplete,
        ...inputProps
    } = props

    const generatedId = useId()
    const inputId = id ?? generatedId
    const listboxId = `${inputId}-address-suggestions`
    const latestRequestIdRef = useRef(0)
    const inputRef = useRef<HTMLInputElement | null>(null)
    const [status, setStatus] = useState<AddressAutocompleteStatus>('idle')
    const [isDropdownOpen, setIsDropdownOpen] = useState(false)
    const [suggestions, setSuggestions] = useState<readonly AddressSuggestion[]>([])
    const [highlightedIndex, setHighlightedIndex] = useState(-1)
    const [previewValue, setPreviewValue] = useState<string | null>(null)
    const [error, setError] = useState<Error | null>(null)
    const [dropdownPosition, setDropdownPosition] = useState<DropdownPosition | null>(null)

    const normalizedMinQueryLength = normalizeNonNegativeInteger(minQueryLength, defaultMinQueryLength)
    const normalizedDebounceMs = normalizeNonNegativeInteger(debounceMs, defaultDebounceMs)
    const normalizedMaxSuggestions = normalizePositiveInteger(maxSuggestions, defaultMaxSuggestions)
    const normalizedDropdownPortalOffset = normalizeNonNegativeInteger(
        dropdownPortalOffset,
        defaultDropdownPortalOffset,
    )
    const isInteractive = !disabled && !readOnly
    const displayedValue = previewValue ?? value
    const trimmedValue = value.trim()

    const requestOptions = useMemo<AddressAutocompleteRequestOptions>(
        () => ({
            countryCodes,
            includedPrimaryTypes,
            language,
            region,
            locationBias,
            locationRestriction,
            origin,
        }),
        [countryCodes, includedPrimaryTypes, language, region, locationBias, locationRestriction, origin],
    )

    const slotState = useMemo<AddressAutocompleteSlotState>(
        () => ({
            status,
            isOpen: isDropdownOpen && shouldShowDropdownForStatus(status, showLoading),
            isLoading: status === 'loading',
            highlightedIndex,
            suggestions,
            error,
        }),
        [error, highlightedIndex, isDropdownOpen, showLoading, status, suggestions],
    )

    const shouldRenderDropdown = slotState.isOpen
    const shouldRenderDropdownPortal = dropdownPortal && shouldRenderDropdown

    const updateDropdownPosition = useCallback(() => {
        const input = inputRef.current

        if (!input) {
            setDropdownPosition(null)
            return
        }

        const rect = input.getBoundingClientRect()
        setDropdownPosition({
            left: rect.left,
            top: rect.bottom + normalizedDropdownPortalOffset,
            width: rect.width,
        })
    }, [normalizedDropdownPortalOffset])

    useEffect(() => {
        if (!shouldRenderDropdownPortal) {
            return
        }

        const animationFrameId = window.requestAnimationFrame(updateDropdownPosition)

        window.addEventListener('resize', updateDropdownPosition)
        window.addEventListener('scroll', updateDropdownPosition, true)

        return () => {
            window.cancelAnimationFrame(animationFrameId)
            window.removeEventListener('resize', updateDropdownPosition)
            window.removeEventListener('scroll', updateDropdownPosition, true)
        }
    }, [shouldRenderDropdownPortal, updateDropdownPosition])

    useEffect(() => {
        if (!provider || !isInteractive || !isDropdownOpen || trimmedValue.length < normalizedMinQueryLength) {
            latestRequestIdRef.current += 1

            const resetTimerId = window.setTimeout(() => {
                setStatus('idle')
                setSuggestions([])
                setHighlightedIndex(-1)
                setPreviewValue(null)
                setError(null)
            }, 0)

            return () => {
                window.clearTimeout(resetTimerId)
            }
        }

        const requestId = latestRequestIdRef.current + 1
        latestRequestIdRef.current = requestId

        const timerId = window.setTimeout(() => {
            if (requestId !== latestRequestIdRef.current) {
                return
            }

            setStatus('loading')
            setError(null)

            void provider
                .getSuggestions(trimmedValue, requestOptions)
                .then((nextSuggestions) => {
                    if (requestId !== latestRequestIdRef.current) {
                        return
                    }

                    const limitedSuggestions = nextSuggestions.slice(0, normalizedMaxSuggestions)
                    setSuggestions(limitedSuggestions)
                    setPreviewValue(null)
                    setHighlightedIndex(limitedSuggestions.length ? 0 : -1)
                    setStatus(limitedSuggestions.length ? 'open' : 'empty')
                })
                .catch((reason: unknown) => {
                    if (requestId !== latestRequestIdRef.current) {
                        return
                    }

                    setSuggestions([])
                    setPreviewValue(null)
                    setHighlightedIndex(-1)
                    setError(toError(reason))
                    setStatus('error')
                })
        }, normalizedDebounceMs)

        return () => {
            window.clearTimeout(timerId)
        }
    }, [
        isDropdownOpen,
        isInteractive,
        normalizedMaxSuggestions,
        normalizedMinQueryLength,
        normalizedDebounceMs,
        provider,
        requestOptions,
        trimmedValue,
    ])

    const closeDropdown = useCallback(() => {
        latestRequestIdRef.current += 1
        provider?.resetSession?.()
        setIsDropdownOpen(false)
        setStatus('idle')
        setSuggestions([])
        setHighlightedIndex(-1)
        setPreviewValue(null)
        setError(null)
    }, [provider])

    const selectSuggestion = useCallback(
        async (suggestion: AddressSuggestion) => {
            if (!provider || disabled || readOnly) {
                return
            }

            latestRequestIdRef.current += 1
            setStatus('loading')
            setError(null)

            try {
                const selectedAddress = await provider.selectSuggestion(suggestion)
                const nextInputValue = getSelectedAddressInputValue
                    ? getSelectedAddressInputValue(selectedAddress, suggestion)
                    : selectedAddress.formattedAddress || suggestion.fullText

                onValueChange(nextInputValue)
                onAddressSelect?.(selectedAddress)
                setIsDropdownOpen(false)
                setStatus('idle')
                setSuggestions([])
                setHighlightedIndex(-1)
                setPreviewValue(null)
            } catch (reason) {
                setError(toError(reason))
                setStatus('error')
                setIsDropdownOpen(true)
            }
        },
        [disabled, getSelectedAddressInputValue, onAddressSelect, onValueChange, provider, readOnly],
    )

    const getSuggestionPreviewValue = useCallback(
        (suggestion: AddressSuggestion) =>
            getHighlightedSuggestionInputValue ? getHighlightedSuggestionInputValue(suggestion) : suggestion.fullText,
        [getHighlightedSuggestionInputValue],
    )

    const highlightSuggestionByIndex = useCallback(
        (index: number, shouldPreview: boolean) => {
            const suggestion = suggestions[index]
            const nextIndex = suggestion ? index : -1

            setHighlightedIndex(nextIndex)

            if (!shouldPreview || !previewHighlightedSuggestion) {
                return
            }

            setPreviewValue(suggestion ? getSuggestionPreviewValue(suggestion) : null)
        },
        [getSuggestionPreviewValue, previewHighlightedSuggestion, suggestions],
    )

    const handleInputFocus: FocusEventHandler<HTMLInputElement> = (event) => {
        onFocus?.(event)

        if (!event.defaultPrevented && isInteractive) {
            setIsDropdownOpen(true)
        }
    }

    const handleInputBlur: FocusEventHandler<HTMLInputElement> = (event) => {
        onBlur?.(event)

        if (!event.defaultPrevented) {
            closeDropdown()
        }
    }

    const handleInputKeyDown: KeyboardEventHandler<HTMLInputElement> = (event) => {
        onKeyDown?.(event)

        if (event.defaultPrevented || !isInteractive) {
            return
        }

        if (event.key === 'ArrowDown') {
            event.preventDefault()
            setIsDropdownOpen(true)
            highlightSuggestionByIndex(getNextHighlightedIndex(highlightedIndex, suggestions.length), true)
            return
        }

        if (event.key === 'ArrowUp') {
            event.preventDefault()
            highlightSuggestionByIndex(getPreviousHighlightedIndex(highlightedIndex, suggestions.length), true)
            return
        }

        const highlightedSuggestion = suggestions[highlightedIndex]

        if (event.key === 'Enter' && status === 'open' && highlightedSuggestion) {
            event.preventDefault()
            void selectSuggestion(highlightedSuggestion)
            return
        }

        if (event.key === 'Escape') {
            event.preventDefault()
            closeDropdown()
            return
        }

        if (event.key === 'Tab') {
            closeDropdown()
        }
    }

    const handleInputChange: ChangeEventHandler<HTMLInputElement> = (event) => {
        const nextValue = event.currentTarget.value
        const nextTrimmedValue = nextValue.trim()

        setPreviewValue(null)
        onValueChange(nextValue)

        if (isInteractive) {
            setIsDropdownOpen(true)

            if (provider && nextTrimmedValue.length >= normalizedMinQueryLength) {
                setStatus('loading')
                setError(null)
            } else {
                setStatus('idle')
                setSuggestions([])
                setHighlightedIndex(-1)
                setPreviewValue(null)
                setError(null)
            }
        }
    }

    const hasActiveDescendant = shouldRenderDropdown && highlightedIndex >= 0 && Boolean(suggestions[highlightedIndex])
    const dropdown = shouldRenderDropdown ? (
        <AddressAutocompleteDropdown
            dropdownClassName={dropdownClassName}
            error={error}
            highlightedIndex={highlightedIndex}
            highlightedSuggestionClassName={highlightedSuggestionClassName}
            listboxId={listboxId}
            query={value}
            renderEmpty={renderEmpty}
            renderError={renderError}
            loadingText={loadingText}
            renderLoading={renderLoading}
            renderSuggestion={renderSuggestion}
            showLoading={showLoading}
            selectSuggestion={selectSuggestion}
            setHighlightedIndex={(index) => highlightSuggestionByIndex(index, false)}
            slotState={slotState}
            status={status}
            statusMessageClassName={statusMessageClassName}
            suggestionClassName={suggestionClassName}
            suggestions={suggestions}
            style={getDropdownStyle(dropdownStyle, shouldRenderDropdownPortal, dropdownPosition)}
        />
    ) : null
    const portalContainer = shouldRenderDropdownPortal ? resolvePortalContainer(dropdownPortalContainer) : null

    return (
        <div className={className}>
            {label ? <label htmlFor={inputId}>{label}</label> : null}
            <input
                {...inputProps}
                id={inputId}
                ref={inputRef}
                aria-activedescendant={hasActiveDescendant ? getSuggestionId(listboxId, highlightedIndex) : undefined}
                aria-autocomplete="list"
                aria-busy={status === 'loading' || undefined}
                aria-controls={shouldRenderDropdown ? listboxId : undefined}
                aria-expanded={shouldRenderDropdown}
                aria-haspopup="listbox"
                autoComplete={autoComplete ?? defaultAutoComplete}
                className={inputClassName}
                disabled={disabled}
                name={inputProps.name ?? getDefaultInputName(inputId)}
                readOnly={readOnly}
                role="combobox"
                type="text"
                value={displayedValue}
                onBlur={handleInputBlur}
                onChange={handleInputChange}
                onFocus={handleInputFocus}
                onKeyDown={handleInputKeyDown}
            />
            {portalContainer ? createPortal(dropdown, portalContainer) : dropdown}
        </div>
    )
}

interface AddressAutocompleteDropdownProps {
    dropdownClassName: string | undefined
    error: Error | null
    highlightedIndex: number
    highlightedSuggestionClassName: string | undefined
    listboxId: string
    query: string
    loadingText: ReactNode
    renderEmpty: ((state: AddressAutocompleteSlotState) => ReactNode) | undefined
    renderError: ((state: AddressAutocompleteSlotState) => ReactNode) | undefined
    renderLoading: ((state: AddressAutocompleteSlotState) => ReactNode) | undefined
    renderSuggestion: AddressAutocompleteInputProps['renderSuggestion']
    selectSuggestion: (suggestion: AddressSuggestion) => Promise<void>
    setHighlightedIndex: (index: number) => void
    showLoading: boolean
    slotState: AddressAutocompleteSlotState
    status: AddressAutocompleteStatus
    statusMessageClassName: string | undefined
    suggestionClassName: string | undefined
    suggestions: readonly AddressSuggestion[]
    style: AddressAutocompleteInputProps['dropdownStyle']
}

function AddressAutocompleteDropdown({
    dropdownClassName,
    error,
    highlightedIndex,
    highlightedSuggestionClassName,
    listboxId,
    query,
    loadingText,
    renderEmpty,
    renderError,
    renderLoading,
    renderSuggestion,
    selectSuggestion,
    setHighlightedIndex,
    showLoading,
    slotState,
    status,
    statusMessageClassName,
    suggestionClassName,
    suggestions,
    style,
}: AddressAutocompleteDropdownProps) {
    return (
        <div id={listboxId} className={dropdownClassName} role="listbox" style={style}>
            {status === 'loading' && showLoading
                ? renderStatusMessage(renderLoading, slotState, statusMessageClassName, loadingText)
                : null}
            {status === 'empty'
                ? renderStatusMessage(renderEmpty, slotState, statusMessageClassName, 'No addresses found')
                : null}
            {status === 'error'
                ? renderStatusMessage(
                      renderError,
                      slotState,
                      statusMessageClassName,
                      error?.message || 'Address lookup failed',
                  )
                : null}
            {status === 'open'
                ? suggestions.map((suggestion, index) => {
                      const isHighlighted = index === highlightedIndex

                      return (
                          <div
                              key={suggestion.placeId}
                              id={getSuggestionId(listboxId, index)}
                              aria-selected={isHighlighted}
                              className={joinClassNames(
                                  suggestionClassName,
                                  isHighlighted && highlightedSuggestionClassName,
                              )}
                              role="option"
                              tabIndex={-1}
                              onPointerDown={(event) => {
                                  event.preventDefault()
                                  void selectSuggestion(suggestion)
                              }}
                              onClick={() => void selectSuggestion(suggestion)}
                              onMouseDown={(event) => event.preventDefault()}
                              onMouseEnter={() => setHighlightedIndex(index)}
                          >
                              {renderSuggestion ? (
                                  renderSuggestion({ suggestion, index, isHighlighted, query })
                              ) : (
                                  <DefaultSuggestion suggestion={suggestion} />
                              )}
                          </div>
                      )
                  })
                : null}
        </div>
    )
}

function DefaultSuggestion({ suggestion }: { suggestion: AddressSuggestion }) {
    return (
        <div>
            <div>{renderMatchedText(suggestion.mainText || suggestion.fullText, suggestion.mainTextMatches)}</div>
            {suggestion.secondaryText ? <small>{suggestion.secondaryText}</small> : null}
        </div>
    )
}

function getDefaultInputName(inputId: string): string {
    const safeInputId = inputId.replace(/[^a-zA-Z0-9_-]/g, '')

    return safeInputId ? `${defaultInputNamePrefix}-${safeInputId}` : defaultInputNamePrefix
}

function renderStatusMessage(
    render: ((state: AddressAutocompleteSlotState) => ReactNode) | undefined,
    state: AddressAutocompleteSlotState,
    className: string | undefined,
    fallback: ReactNode,
) {
    return (
        <div className={className} role="status">
            {render ? render(state) : fallback}
        </div>
    )
}

function getDropdownStyle(
    dropdownStyle: AddressAutocompleteInputProps['dropdownStyle'],
    shouldRenderDropdownPortal: boolean,
    dropdownPosition: DropdownPosition | null,
): AddressAutocompleteInputProps['dropdownStyle'] {
    if (!shouldRenderDropdownPortal || !dropdownPosition) {
        return dropdownStyle
    }

    return {
        position: 'fixed',
        left: dropdownPosition.left,
        top: dropdownPosition.top,
        right: 'auto',
        bottom: 'auto',
        width: dropdownPosition.width,
        ...dropdownStyle,
    }
}

function resolvePortalContainer(
    dropdownPortalContainer: AddressAutocompleteInputProps['dropdownPortalContainer'],
): HTMLElement | null {
    if (typeof document === 'undefined') {
        return null
    }

    if (typeof dropdownPortalContainer === 'function') {
        return dropdownPortalContainer()
    }

    return dropdownPortalContainer ?? document.body
}

function renderMatchedText(text: string, matches: readonly AddressTextMatch[]) {
    if (!matches.length) {
        return text
    }

    const fragments: ReactNode[] = []
    let cursor = 0

    for (const match of matches) {
        const startOffset = clamp(match.startOffset, 0, text.length)
        const endOffset = clamp(match.endOffset, startOffset, text.length)

        if (startOffset > cursor) {
            fragments.push(text.slice(cursor, startOffset))
        }

        if (endOffset > startOffset) {
            fragments.push(<mark key={`${startOffset}-${endOffset}`}>{text.slice(startOffset, endOffset)}</mark>)
        }

        cursor = endOffset
    }

    if (cursor < text.length) {
        fragments.push(text.slice(cursor))
    }

    return fragments
}

function shouldShowDropdownForStatus(status: AddressAutocompleteStatus, showLoading: boolean): boolean {
    return status === 'open' || status === 'empty' || status === 'error' || (status === 'loading' && showLoading)
}

function getNextHighlightedIndex(currentIndex: number, suggestionCount: number): number {
    if (!suggestionCount) {
        return -1
    }

    return currentIndex >= suggestionCount - 1 ? 0 : currentIndex + 1
}

function getPreviousHighlightedIndex(currentIndex: number, suggestionCount: number): number {
    if (!suggestionCount) {
        return -1
    }

    return currentIndex <= 0 ? suggestionCount - 1 : currentIndex - 1
}

function getSuggestionId(listboxId: string, index: number): string {
    return `${listboxId}-option-${index}`
}

function normalizeNonNegativeInteger(value: number, fallback: number): number {
    return Number.isFinite(value) ? Math.max(0, Math.floor(value)) : fallback
}

function normalizePositiveInteger(value: number, fallback: number): number {
    return Number.isFinite(value) ? Math.max(1, Math.floor(value)) : fallback
}

function toError(value: unknown): Error {
    if (value instanceof Error) {
        return value
    }

    return new Error(typeof value === 'string' ? value : 'Unknown address autocomplete error')
}

function joinClassNames(...classes: readonly (string | false | null | undefined)[]): string | undefined {
    const className = classes.filter(Boolean).join(' ')
    return className || undefined
}

function clamp(value: number, min: number, max: number): number {
    return Math.min(Math.max(value, min), max)
}
