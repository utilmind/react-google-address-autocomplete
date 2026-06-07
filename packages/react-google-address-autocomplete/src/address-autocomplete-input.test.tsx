import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { describe, expect, it } from 'vitest'

import { AddressAutocompleteInput } from './address-autocomplete-input'

function StatefulAddressInput() {
    const [value, setValue] = useState('')

    return <AddressAutocompleteInput label="Address" placeholder="Start typing" value={value} onValueChange={setValue} />
}

describe('AddressAutocompleteInput', () => {
    it('renders a controlled address input', async () => {
        const user = userEvent.setup()

        render(<StatefulAddressInput />)

        const input = screen.getByLabelText('Address') as HTMLInputElement
        await user.type(input, '13133 34th Street North')

        expect(input.value).toBe('13133 34th Street North')
    })
})
