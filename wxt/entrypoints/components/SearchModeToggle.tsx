interface SearchModeToggleProps {
    useWords: boolean;
    onChange: (useWords: boolean) => void;
}

function SearchModeToggle({ useWords, onChange }: SearchModeToggleProps) {
    return (
        <div className="justify-content-center my-2">
            <div className="form-check-label mb-2">For searches use random:</div>
            <div className="search mb-4">
                <ul>
                    <li id="wordsBtn" className={useWords ? 'active' : ''} onClick={() => onChange(true)}>
                        <span>words (new)</span>
                    </li>
                    <li id="stringsBtn" className={!useWords ? 'active' : ''} onClick={() => onChange(false)}>
                        <span>letters (old)</span>
                    </li>
                </ul>
            </div>
        </div>
    );
}

export default SearchModeToggle;
