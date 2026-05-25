import { useState, useRef, useEffect } from 'react';

export default function SkillAutocomplete({
  skills,
  selectedSkills,
  onAdd,
  onRemove,
  maxSkills = 7,
  placeholder = 'Type a skill...',
}) {
  const [query, setQuery] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [highlightIdx, setHighlightIdx] = useState(0);
  const inputRef = useRef(null);
  const wrapperRef = useRef(null);

  const filtered = query.trim()
    ? skills
        .filter(s => s.toLowerCase().includes(query.toLowerCase()))
        .filter(s => !selectedSkills.includes(s))
        .slice(0, 8)
    : [];

  const atMax = selectedSkills.length >= maxSkills;

  useEffect(() => {
    function handleClick(e) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (filtered.length > 0 && filtered[highlightIdx]) {
        addSkill(filtered[highlightIdx]);
      } else if (query.trim() && !atMax) {
        addSkill(query.trim());
      }
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightIdx(i => Math.min(i + 1, filtered.length - 1));
      setShowSuggestions(true);
    }
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightIdx(i => Math.max(i - 1, 0));
    }
    if (e.key === 'Backspace' && !query && selectedSkills.length > 0) {
      onRemove(selectedSkills[selectedSkills.length - 1]);
    }
  };

  const addSkill = (skill) => {
    if (!atMax && !selectedSkills.includes(skill)) {
      onAdd(skill);
      setQuery('');
      setHighlightIdx(0);
      setShowSuggestions(false);
      inputRef.current?.focus();
    }
  };

  return (
    <div ref={wrapperRef} className="relative">
      <div className="flex flex-wrap gap-1.5 mb-2 min-h-[32px] items-center">
        {selectedSkills.map(skill => (
          <span
            key={skill}
            className="group inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-accent/15 text-accent border border-accent/30 text-xs font-medium"
          >
            {skill}
            <button
              onClick={() => onRemove(skill)}
              className="w-3.5 h-3.5 rounded-full bg-accent/20 text-accent hover:bg-accent/40 flex items-center justify-center text-[10px] leading-none transition-colors"
            >
              ×
            </button>
          </span>
        ))}
        {!atMax && (
          <input
            ref={inputRef}
            value={query}
            onChange={e => {
              setQuery(e.target.value);
              setShowSuggestions(true);
              setHighlightIdx(0);
            }}
            onFocus={() => setShowSuggestions(true)}
            onKeyDown={handleKeyDown}
            disabled={atMax}
            placeholder={selectedSkills.length === 0 ? placeholder : 'Add more...'}
            className="flex-1 min-w-[120px] bg-transparent border-none outline-none text-sm text-text placeholder-text-muted py-1"
          />
        )}
      </div>

      {atMax && (
        <div className="text-[10px] text-text-muted mb-2">
          Max {maxSkills} skills reached. Remove one to add another.
        </div>
      )}

      {showSuggestions && query.trim() && filtered.length > 0 && (
        <div className="absolute z-20 w-full bg-surface border border-accent/20 rounded-lg shadow-xl mt-0.5 overflow-hidden">
          {filtered.map((skill, i) => (
            <button
              key={skill}
              onClick={() => addSkill(skill)}
              onMouseEnter={() => setHighlightIdx(i)}
              className={`w-full text-left px-4 py-2.5 text-sm transition-colors ${
                i === highlightIdx
                  ? 'bg-accent/10 text-accent'
                  : 'text-text-secondary hover:bg-elevated hover:text-text'
              }`}
            >
              <span className="font-medium">{skill.slice(0, query.length)}</span>
              <span className="text-text-muted">{skill.slice(query.length)}</span>
            </button>
          ))}
          {!atMax && !filtered.some(f => f.toLowerCase() === query.trim().toLowerCase()) && (
            <div className="px-4 py-2.5 text-xs text-text-muted border-t border-accent/5">
              Press Enter to add <span className="text-text font-medium">&quot;{query.trim()}&quot;</span> as a custom skill
            </div>
          )}
        </div>
      )}
    </div>
  );
}
