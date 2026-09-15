import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';

/**
 * Custom DropdownInput Component
 * Combines an input field with a floating dropdown menu (with checkmarks and custom dark/light styling).
 * Supports typing custom text, selecting from preset options, filtering, and icon adornments.
 */
const DropdownInput = ({
  label,
  value,
  onChange,
  options = [], // Can be array of strings, objects { value, label }, or category groups { category, items }
  placeholder = '',
  required = false,
  type = 'text',
  isTextArea = false,
  rows = 3,
  icon: Icon,
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const containerRef = useRef(null);

  // Close dropdown menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Handle option click
  const handleSelectOption = (optVal) => {
    onChange(optVal);
    setIsOpen(false);
    setSearchTerm('');
  };

  // Helper to normalize options
  const isGrouped = options.length > 0 && options[0]?.category;

  const renderOptionItem = (optVal, optLabel) => {
    const isSelected = String(value) === String(optVal);
    return (
      <button
        key={String(optVal)}
        type="button"
        onClick={() => handleSelectOption(optVal)}
        className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-medium flex items-center justify-between transition-colors cursor-pointer ${
          isSelected
            ? 'bg-indigo-600 text-white font-semibold shadow-xs'
            : 'text-slate-200 hover:bg-slate-700/80 hover:text-white'
        }`}
      >
        <span className="truncate flex-1 pr-2">{optLabel}</span>
        {isSelected && <Check className="w-3.5 h-3.5 shrink-0 text-white" />}
      </button>
    );
  };

  return (
    <div className={`relative w-full ${className}`} ref={containerRef}>
      {label && (
        <label className="block font-semibold text-slate-700 text-xs mb-1">
          {label}
        </label>
      )}

      <div className="relative flex items-center">
        {Icon && (
          <Icon className="w-4 h-4 text-slate-400 absolute left-3 pointer-events-none z-10" />
        )}

        {isTextArea ? (
          <textarea
            value={value}
            onChange={(e) => {
              onChange(e.target.value);
              setSearchTerm(e.target.value);
            }}
            onClick={() => setIsOpen(true)}
            onFocus={() => setIsOpen(true)}
            placeholder={placeholder}
            rows={rows}
            required={required}
            className={`w-full ${Icon ? 'pl-9' : 'pl-3.5'} pr-10 py-2.5 rounded-xl border border-slate-200 text-slate-800 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-hidden bg-white shadow-2xs transition-all`}
          />
        ) : (
          <input
            type={type}
            value={value}
            onChange={(e) => {
              onChange(e.target.value);
              setSearchTerm(e.target.value);
            }}
            onClick={() => setIsOpen(true)}
            onFocus={() => setIsOpen(true)}
            placeholder={placeholder}
            required={required}
            className={`w-full ${Icon ? 'pl-9' : 'pl-3.5'} pr-10 py-2.5 rounded-xl border border-slate-200 text-slate-800 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-hidden bg-white shadow-2xs transition-all`}
          />
        )}

        {/* Dropdown Arrow Toggle Button */}
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setIsOpen((prev) => !prev);
          }}
          className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors z-10 cursor-pointer"
          tabIndex={-1}
          aria-label="Toggle dropdown options"
        >
          <ChevronDown
            className={`w-4 h-4 transition-transform duration-200 ${
              isOpen ? 'rotate-180 text-indigo-600' : ''
            }`}
          />
        </button>
      </div>

      {/* Floating Dropdown Options Menu (Dark themed like Image 1) */}
      {isOpen && (
        <div className="absolute left-0 right-0 top-full mt-1.5 bg-slate-800 text-white rounded-2xl shadow-xl border border-slate-700/80 overflow-hidden z-50 max-h-60 overflow-y-auto backdrop-blur-md animate-in fade-in slide-in-from-top-2 duration-150">
          <div className="p-1.5 space-y-0.5">
            {isGrouped ? (
              options.map((group, gIdx) => (
                <div key={gIdx} className="space-y-0.5">
                  <div className="px-3 py-1 text-[10px] font-bold tracking-wider text-slate-400 uppercase">
                    {group.category}
                  </div>
                  {group.items.map((item) => {
                    const optVal = typeof item === 'object' ? item.value : item;
                    const optLabel = typeof item === 'object' ? item.label : item;
                    return renderOptionItem(optVal, optLabel);
                  })}
                </div>
              ))
            ) : options.length > 0 ? (
              options.map((opt) => {
                const optVal = typeof opt === 'object' ? opt.value : opt;
                const optLabel = typeof opt === 'object' ? opt.label : opt;
                return renderOptionItem(optVal, optLabel);
              })
            ) : (
              <div className="px-3.5 py-2.5 text-xs text-slate-400 italic">
                No predefined options available. You can type custom text above.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default DropdownInput;
