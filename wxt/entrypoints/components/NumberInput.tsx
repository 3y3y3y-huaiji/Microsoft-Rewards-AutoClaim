interface NumberInputProps {
    id: string;
    label: string;
    value: number;
    min: number;
    max: number;
    onChange: (value: number) => void;
}

function NumberInput({ id, label, value, min, max, onChange }: NumberInputProps) {
    return (
        <span>
            <input type="number" id={id} min={min} max={max} value={value}
                   onChange={(e) => onChange(parseFloat(e.target.value))} />
            <label htmlFor={id}>{label}</label>
        </span>
    );
}

export default NumberInput;
