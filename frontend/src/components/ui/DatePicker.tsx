/**
 * @fileoverview Componente date picker con 3 dropdown.
 * 
 * Selettore data con dropdown separati per giorno, mese e anno.
 * Stile Instagram consistente.
 * 
 * @module components/ui/DatePicker
 */

'use client';

export interface DatePickerValue {
  day: string;
  month: string;
  year: string;
}

export interface DatePickerProps {
  /** Valore corrente */
  value: DatePickerValue;
  /** Handler cambio valore */
  onChange: (value: DatePickerValue) => void;
  /** Range di anni da mostrare (default: ultimi 110 anni) */
  yearRange?: number;
  /** Anno minimo (default: anno corrente - yearRange) */
  minYear?: number;
  /** Classe CSS aggiuntiva */
  className?: string;
  /** Campo con errore */
  hasError?: boolean;
  /** Disabilitato */
  disabled?: boolean;
}

/** Lista dei giorni 1-31 */
const DAYS = Array.from({ length: 31 }, (_, i) => i + 1);

/** Lista dei mesi in italiano */
const MONTHS = [
  'gennaio', 'febbraio', 'marzo', 'aprile',
  'maggio', 'giugno', 'luglio', 'agosto',
  'settembre', 'ottobre', 'novembre', 'dicembre'
];

/**
 * Genera la lista degli anni disponibili.
 */
function getYears(range: number, minYear?: number): number[] {
  const currentYear = new Date().getFullYear();
  const startYear = minYear ?? (currentYear - range);
  return Array.from({ length: range + 1 }, (_, i) => currentYear - i)
    .filter(year => year >= startYear);
}

/**
 * Date picker con 3 dropdown separati.
 * 
 * @example
 * ```tsx
 * <DatePicker
 *   value={{ day: '15', month: '6', year: '1990' }}
 *   onChange={(date) => setBirthday(date)}
 * />
 * ```
 */
export function DatePicker({
  value,
  onChange,
  yearRange = 110,
  minYear,
  className = '',
  hasError = false,
  disabled = false,
}: DatePickerProps) {
  const years = getYears(yearRange, minYear);
  
  const selectClasses = `flex-1 px-3 py-2.5 border rounded-lg bg-white dark:bg-[#262626] text-[#262626] dark:text-white focus:outline-none focus:ring-1 text-sm appearance-none cursor-pointer ${
    hasError
      ? 'border-red-500 focus:ring-red-500'
      : 'border-gray-300 dark:border-gray-600 focus:ring-gray-400 dark:focus:ring-gray-500'
  }`;
  
  // Classe per le opzioni del dropdown (supporto dark mode)
  const optionClasses = 'bg-white dark:bg-[#262626] text-[#262626] dark:text-white';
  
  return (
    <div className={`flex gap-3 ${className}`}>
      {/* Day */}
      <select
        value={value.day}
        onChange={(e) => onChange({ ...value, day: e.target.value })}
        className={selectClasses}
        disabled={disabled}
        aria-label="Giorno"
      >
        <option value="" className={optionClasses}>Giorno</option>
        {DAYS.map(day => (
          <option key={day} value={String(day)} className={optionClasses}>{day}</option>
        ))}
      </select>
      
      {/* Month */}
      <select
        value={value.month}
        onChange={(e) => onChange({ ...value, month: e.target.value })}
        className={selectClasses}
        disabled={disabled}
        aria-label="Mese"
      >
        <option value="" className={optionClasses}>Mese</option>
        {MONTHS.map((month, index) => (
          <option key={month} value={String(index + 1)} className={optionClasses}>{month}</option>
        ))}
      </select>
      
      {/* Year */}
      <select
        value={value.year}
        onChange={(e) => onChange({ ...value, year: e.target.value })}
        className={selectClasses}
        disabled={disabled}
        aria-label="Anno"
      >
        <option value="" className={optionClasses}>Anno</option>
        {years.map(year => (
          <option key={year} value={String(year)} className={optionClasses}>{year}</option>
        ))}
      </select>
    </div>
  );
}

/**
 * Converte un DatePickerValue in una stringa ISO date.
 */
export function datePickerToISO(value: DatePickerValue): string | null {
  if (!value.day || !value.month || !value.year) return null;
  const month = value.month.padStart(2, '0');
  const day = value.day.padStart(2, '0');
  return `${value.year}-${month}-${day}`;
}

/**
 * Converte una stringa ISO date in DatePickerValue.
 */
export function isoToDatePicker(isoDate: string | null): DatePickerValue {
  if (!isoDate) return { day: '', month: '', year: '' };
  const date = new Date(isoDate);
  return {
    day: String(date.getDate()),
    month: String(date.getMonth() + 1),
    year: String(date.getFullYear()),
  };
}
