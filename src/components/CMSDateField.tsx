import React, { useState, useEffect, useRef } from 'react';
import { Calendar, CheckCircle2, AlertTriangle, AlertCircle } from 'lucide-react';
import { parseFlexibleDate, ParsedDateResult, DatePrecision } from '../utils/date';

export interface CMSDateFieldProps {
  label?: string;
  value: string;
  onChange: (value: string, meta?: { normalizedDate: string; datePrecision: DatePrecision; sortValue: number }) => void;
  placeholder?: string;
  className?: string;
  required?: boolean;
  helpText?: string;
}

export const CMSDateField: React.FC<CMSDateFieldProps> = ({
  label = 'Publishing Date / Period',
  value,
  onChange,
  placeholder = 'e.g. 21 Sep 2026, 21/09/2026, September 2026, or 2026',
  className = '',
  required = false,
  helpText = 'Accepts DD/MM/YYYY, MM/DD/YYYY, YYYY-MM-DD, Month YYYY, or Year only.'
}) => {
  const [inputValue, setInputValue] = useState(value || '');
  const dateInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setInputValue(value || '');
  }, [value]);

  const parsed: ParsedDateResult = parseFlexibleDate(inputValue);

  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVal = e.target.value;
    setInputValue(newVal);
    const res = parseFlexibleDate(newVal);
    if (res.isValid && !res.isAmbiguous) {
      onChange(res.displayDate, {
        normalizedDate: res.normalizedDate,
        datePrecision: res.precision,
        sortValue: res.sortValue
      });
    } else {
      onChange(newVal);
    }
  };

  const handleDatePickerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedDateStr = e.target.value;
    if (!selectedDateStr) return;
    const res = parseFlexibleDate(selectedDateStr);
    if (res.isValid) {
      setInputValue(res.displayDate);
      onChange(res.displayDate, {
        normalizedDate: res.normalizedDate,
        datePrecision: res.precision,
        sortValue: res.sortValue
      });
    }
  };

  const handleSelectAmbiguousOption = (option: { label: string; normalizedDate: string; displayDate: string; precision: DatePrecision; sortValue: number }) => {
    setInputValue(option.displayDate);
    onChange(option.displayDate, {
      normalizedDate: option.normalizedDate,
      datePrecision: option.precision,
      sortValue: option.sortValue
    });
  };

  return (
    <div className={`space-y-1.5 ${className}`}>
      {label && (
        <label className="block text-xs font-mono uppercase font-bold text-ink">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}

      <div className="relative flex items-center">
        <input
          type="text"
          value={inputValue}
          onChange={handleTextChange}
          placeholder={placeholder}
          required={required}
          className="w-full px-3 py-2 pr-10 text-sm font-sans bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-brand-blue/30 focus:border-brand-blue"
        />

        <input
          ref={dateInputRef}
          type="date"
          onChange={handleDatePickerChange}
          className="sr-only"
        />

        <button
          type="button"
          onClick={() => {
            if (dateInputRef.current) {
              if (typeof dateInputRef.current.showPicker === 'function') {
                dateInputRef.current.showPicker();
              } else {
                dateInputRef.current.click();
              }
            }
          }}
          className="absolute right-2 p-1.5 text-slate-400 hover:text-brand-blue transition-colors rounded hover:bg-slate-100"
          title="Open calendar picker"
        >
          <Calendar className="w-4 h-4" />
        </button>
      </div>

      {helpText && !inputValue && (
        <p className="text-[11px] text-mut font-sans">{helpText}</p>
      )}

      {inputValue.trim() !== '' && (
        <div className="mt-1.5 text-xs font-sans">
          {parsed.isValid && !parsed.isAmbiguous && (
            <div className="flex items-center gap-1.5 text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1.5 rounded-md">
              <CheckCircle2 className="w-3.5 h-3.5 shrink-0 text-emerald-600" />
              <span>
                <strong>Interpreted as:</strong> {parsed.displayDate}
                <span className="text-emerald-600/80 ml-1.5 text-[11px]">
                  ({parsed.precision === 'day' ? 'Full Date' : parsed.precision === 'month' ? 'Month & Year' : 'Year Only'}, ISO: {parsed.normalizedDate})
                </span>
              </span>
            </div>
          )}

          {parsed.isAmbiguous && parsed.ambiguousOptions && (
            <div className="p-2.5 bg-amber-50 border border-amber-300 rounded-md space-y-2 text-amber-900">
              <div className="flex items-start gap-1.5 font-medium text-xs">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <strong>Ambiguous date format detected!</strong>
                  <p className="text-[11px] text-amber-800 font-normal">What date did you mean?</p>
                </div>
              </div>

              <div className="flex flex-wrap gap-2 pt-1">
                {parsed.ambiguousOptions.map((opt, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSelectAmbiguousOption(opt)}
                    className="px-2.5 py-1 text-xs font-medium bg-white text-amber-900 border border-amber-300 hover:bg-amber-100 hover:border-amber-400 rounded shadow-sm transition-colors"
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {!parsed.isValid && (
            <div className="flex items-center gap-1.5 text-red-700 bg-red-50 border border-red-200 px-2.5 py-1.5 rounded-md">
              <AlertCircle className="w-3.5 h-3.5 shrink-0 text-red-600" />
              <span>
                <strong>Invalid date:</strong> {parsed.error || 'Unrecognized format. Please enter a valid date.'}
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
