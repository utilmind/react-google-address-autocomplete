import { useState } from 'react'
import { AddressAutocompleteInput } from 'react-google-address-autocomplete'

export default function App() {
    const [address, setAddress] = useState('')

    return (
        <main className="page-shell">
            <section className="demo-card">
                <p className="eyebrow">Component demo</p>
                <h1>React Google Address Autocomplete</h1>
                <p className="summary">
                    This demo currently shows the controlled input scaffold. Google Places suggestions will be added in
                    the next implementation step.
                </p>

                <AddressAutocompleteInput
                    className="field"
                    inputClassName="input"
                    label="Address"
                    placeholder="Start typing an address"
                    value={address}
                    onValueChange={setAddress}
                />

                <dl className="output">
                    <dt>Current value</dt>
                    <dd>{address || 'No address typed yet'}</dd>
                </dl>
            </section>
        </main>
    )
}
