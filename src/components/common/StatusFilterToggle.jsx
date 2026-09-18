import React from 'react';
import { ChevronDown } from 'lucide-react';

/**
 * Reusable dropdown component for status filtering across all CRM pages
 * @param {Array<string|{label: string, value: string}>} options - e.g. ['All', 'Active', 'Inactive']
 * @param {string} value - Current active value
 * @param {Function} onChange - Callback when selected
 * @param {string} className - Additional CSS classes
 * @param {string} [label] - Prefix label text e.g. "Status:"
 */
export default function StatusFilterToggle({
  options = ['All', 'Active', 'Inactive'],
  value = 'All',
  onChange,
  className = '',
  label = 'Status:',
}) {
  return (
    <div className={`flex items-center gap-1.5 ${className}`}>
      {label && (
        <span className="text-[11px] font-medium text-[#78716C] select-none">
          {label}
        </span>
      )}
      <div className="relative inline-block">
        <select
          value={value}
          onChange={(e) => onChange && onChange(e.target.value)}
          className="appearance-none pl-2.5 pr-6 py-1 text-[11px] font-medium rounded-lg border border-[#E2DDD5] bg-[#FAF8F5] hover:bg-white text-[#1A1817] focus:outline-none focus:border-[#C99C4B] focus:bg-white shadow-2xs transition-all cursor-pointer"
        >
          {options.map((opt) => {
            const val = typeof opt === 'string' ? opt : opt.value;
            let displayLabel = typeof opt === 'string' ? opt : opt.label;

            // Enhance "All" label if default string passed
            if (val === 'All' && displayLabel === 'All') {
              displayLabel = label?.toLowerCase().includes('type')
                ? 'All Types'
                : label?.toLowerCase().includes('period')
                ? 'All Periods'
                : 'All Status';
            }

            return (
              <option key={val} value={val} className="text-[#1A1817] bg-white py-0.5 text-[11px] font-normal">
                {displayLabel}
              </option>
            );
          })}
        </select>
        <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-3 w-3 text-[#78716C] pointer-events-none" />
      </div>
    </div>
  );
}
