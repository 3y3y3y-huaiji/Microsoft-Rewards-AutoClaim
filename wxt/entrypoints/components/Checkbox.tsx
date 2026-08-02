interface CheckboxProps {
    checked: boolean;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    name: string;
}

function Checkbox({ checked, onChange, name }: CheckboxProps) {
    return (
        <span>
            <input type="checkbox" id={`${name}-checkbox`} checked={checked} onChange={onChange} />
            <label htmlFor={`${name}-checkbox`}>{name}</label>
        </span>
    );
}

export default Checkbox;
