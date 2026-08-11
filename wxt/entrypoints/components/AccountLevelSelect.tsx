interface AccountLevelSelectProps {
    value: string;
    onChange: (level: string) => void;
}

const LEVELS: { value: string; label: string }[] = [
    { value: 'member', label: '基础会员 (Member)' },
    { value: 'silver', label: '白银会员 (Silver)' },
    { value: 'gold', label: '黄金会员 (Gold)' },
];

// The label links to the Rewards benefits page so users can check which level
// they're on. Picking a level sets a sensible default search count.
function AccountLevelSelect({ value, onChange }: AccountLevelSelectProps) {
    return (
        <span className="field">
            <select id="accountLevel" value={value} onChange={(e) => onChange(e.target.value)}>
                {LEVELS.map((level) => (
                    <option key={level.value} value={level.value}>{level.label}</option>
                ))}
            </select>
            <label htmlFor="accountLevel">
                <a className="normal-link level-link" href="https://rewards.bing.com/about?section=benefits" target="_blank" rel="noopener noreferrer">账号等级</a>
            </label>
        </span>
    );
}

export default AccountLevelSelect;
