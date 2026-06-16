import React, { useState, useRef, useEffect } from 'react';
import { Search, ChevronDown, Check, X } from 'lucide-react';

interface SearchableSelectOption {
  value: string;
  label: string;
}

interface SearchableSelectProps {
  options: SearchableSelectOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  disabled?: boolean;
}

export default function SearchableSelect({
  options,
  value,
  onChange,
  placeholder,
  disabled = false,
}: SearchableSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedOption = options.find((opt) => opt.value === value);

  // Synchronize dynamic input text with selected value name on close or open
  useEffect(() => {
    if (selectedOption) {
      setSearch(selectedOption.label);
    } else {
      setSearch('');
    }
  }, [value, selectedOption, isOpen]);

  const filteredOptions = options.filter((opt) =>
    opt.label.toLowerCase().includes(search.toLowerCase()) ||
    opt.value.toLowerCase().includes(search.toLowerCase())
  );

  const handleSelect = (val: string) => {
    onChange(val);
    setIsOpen(false);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange('');
    setSearch('');
    setIsOpen(false);
  };

  return (
    <div className="relative w-full" ref={containerRef}>
      {/* input selector box */}
      <div
        onClick={() => !disabled && setIsOpen(!isOpen)}
        className={`flex items-center justify-between w-full bg-slate-50 border ${
          isOpen ? 'border-cyan-500 ring-1 ring-cyan-500 bg-white' : 'border-slate-205 border-slate-200'
        } p-2.5 rounded-lg cursor-pointer text-xs text-slate-800 transition-all ${
          disabled ? 'opacity-50 cursor-not-allowed' : ''
        }`}
      >
        <div className="flex-1 min-w-0 pr-2">
          {isOpen ? (
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Ketik untuk mencari..."
              className="w-full bg-transparent border-none p-0 outline-none focus:ring-0 text-xs text-slate-900 font-medium"
              onClick={(e) => e.stopPropagation()}
              autoFocus
            />
          ) : (
            <span className={`block truncate ${selectedOption ? 'text-slate-800 font-semibold' : 'text-slate-400 font-normal'}`}>
              {selectedOption ? selectedOption.label : placeholder}
            </span>
          )}
        </div>

        <div className="flex items-center gap-1.5 shrink-0 text-slate-450">
          {value && !disabled && (
            <button
              onClick={handleClear}
              className="p-0.5 hover:bg-slate-200 rounded-full transition text-slate-400 hover:text-slate-600"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
          <ChevronDown className={`w-4 h-4 transition ${isOpen ? 'rotate-180 text-cyan-600' : ''}`} />
        </div>
      </div>

      {/* dropdown popup list */}
      {isOpen && !disabled && (
        <div className="absolute left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-xl z-50 max-h-60 overflow-y-auto animate-fadeIn divide-y divide-slate-100">
          <div className="p-1">
            {filteredOptions.length > 0 ? (
              filteredOptions.map((opt) => {
                const isSelected = opt.value === value;
                return (
                  <div
                    key={opt.value}
                    onClick={() => handleSelect(opt.value)}
                    className={`flex items-center justify-between px-3 py-2 text-xs rounded-lg cursor-pointer transition ${
                      isSelected ? 'bg-cyan-50 text-cyan-800 font-bold' : 'text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <span className="truncate">{opt.label}</span>
                    {isSelected && <Check className="w-3.5 h-3.5 text-cyan-600 shrink-0 ml-2" />}
                  </div>
                );
              })
            ) : (
              <div className="px-3 py-2.5 text-xs text-slate-400 italic text-center">
                Tidak ada hasil ditemukan
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
