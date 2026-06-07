import { useId } from 'react'

import type { AddressAutocompleteInputProps } from './types'

function markReservedPropsAsUsed(...values: readonly unknown[]) {
    // These props are reserved for the upcoming autocomplete/dropdown implementation.
    return values.length
}

export function AddressAutocompleteInput(props: AddressAutocompleteInputProps) {
    const {
        id,
        value,
        onValueChange,
        label,
        className,
        inputClassName,
        provider: _provider,
        minQueryLength: _minQueryLength,
        debounceMs: _debounceMs,
        maxSuggestions: _maxSuggestions,
        countryCodes: _countryCodes,
        includedPrimaryTypes: _includedPrimaryTypes,
        language: _language,
        region: _region,
        locationBias: _locationBias,
        locationRestriction: _locationRestriction,
        origin: _origin,
        dropdownClassName: _dropdownClassName,
        onAddressSelect: _onAddressSelect,
        renderSuggestion: _renderSuggestion,
        renderLoading: _renderLoading,
        renderEmpty: _renderEmpty,
        renderError: _renderError,
        ...inputProps
    } = props

    const generatedId = useId()
    const inputId = id ?? generatedId

    markReservedPropsAsUsed(
        _provider,
        _minQueryLength,
        _debounceMs,
        _maxSuggestions,
        _countryCodes,
        _includedPrimaryTypes,
        _language,
        _region,
        _locationBias,
        _locationRestriction,
        _origin,
        _dropdownClassName,
        _onAddressSelect,
        _renderSuggestion,
        _renderLoading,
        _renderEmpty,
        _renderError,
    )

    return (
        <div className={className}>
            {label ? <label htmlFor={inputId}>{label}</label> : null}
            <input
                {...inputProps}
                id={inputId}
                className={inputClassName}
                type="text"
                value={value}
                onChange={(event) => onValueChange(event.currentTarget.value)}
            />
        </div>
    )
}
