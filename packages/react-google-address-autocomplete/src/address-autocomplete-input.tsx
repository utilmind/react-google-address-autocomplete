import { useId } from 'react'

import type { AddressAutocompleteInputProps } from './types'

export function AddressAutocompleteInput(props: AddressAutocompleteInputProps) {
    const {
        id,
        value,
        onValueChange,
        label,
        className,
        inputClassName,
        minQueryLength: _minQueryLength,
        debounceMs: _debounceMs,
        maxSuggestions: _maxSuggestions,
        countryCodes: _countryCodes,
        dropdownClassName: _dropdownClassName,
        onAddressSelect: _onAddressSelect,
        ...inputProps
    } = props

    const generatedId = useId()
    const inputId = id ?? generatedId

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
