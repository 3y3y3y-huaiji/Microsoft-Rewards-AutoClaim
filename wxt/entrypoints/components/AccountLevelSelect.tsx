interface AccountLevelSelectProps {
    value: string;
    onChange: (level: string) => void;
}

const LEVELS: { value: string; label: string }[] = [
    { value: 'member', label: 'Member' },
    { value: 'silver', label: 'Silver' },
    { value: 'gold', label: 'Gold' },
];

// The label links to the Rewards benefits page so users can check which level
// they're on. Picking a level sets a sensible default search count.
function AccountLevelSelect({ value, onChange }: AccountLevelSelectProps) {
    return (
        <span>
            <select id="accountLevel" value={value} onChange={(e) => onChange(e.target.value)}>
                {LEVELS.map((level) => (
                    <option key={level.value} value={level.value}>{level.label}</option>
                ))}
            </select>
            <label htmlFor="accountLevel">
                <a href="https://rewards.bing.com/about?section=benefits" target="_blank" rel="noopener noreferrer">account level</a>
            </label>
        </span>
    );
}

export default AccountLevelSelect;
