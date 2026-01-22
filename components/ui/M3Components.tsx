import React, { useState, useRef, useEffect } from 'react';
import { formatDateDDMMYYYY, parseTripDate, isValidDDMMYYYY, toISODate } from '../../lib/dateUtils';

export const M3Button: React.FC<{
  variant?: 'filled' | 'tonal' | 'outlined' | 'text' | 'error';
  children: React.ReactNode;
onClick?: React.MouseEventHandler<HTMLButtonElement>;
  className?: string;
  disabled?: boolean;
  fullWidth?: boolean;
  type?: 'submit' | 'button' | 'reset';
}> = ({ variant = 'filled', children, onClick, className = '', disabled, fullWidth, type = 'button' }) => {
  const base = "h-12 px-8 rounded-full text-[11px] font-black transition-all active:scale-95 flex items-center justify-center gap-3 disabled:opacity-40 disabled:active:scale-100 tracking-widest";
  const styles = {
    filled: "bg-[#0A3D91] text-white hover:bg-blue-800 shadow-xl shadow-blue-900/10",
    tonal: "bg-[#D7E2FF] text-[#001A40] hover:bg-blue-200",
    outlined: "border-2 border-[#D7E2FF] text-[#0A3D91] hover:bg-blue-50/50",
    text: "text-[#0A3D91] hover:bg-blue-50/50",
    error: "bg-[#BA1A1A] text-white hover:bg-red-800"
  };

  return (
    <button 
      type={type}
      disabled={disabled}
      onClick={onClick} 
      className={`${base} ${styles[variant]} ${fullWidth ? 'w-full' : ''} ${className}`}
    >
      {children}
    </button>
  );
};

export const M3Card: React.FC<{
  children: React.ReactNode;
  variant?: 'elevated' | 'filled' | 'outlined';
  onClick?: React.MouseEventHandler<HTMLDivElement>;
  className?: string;
}> = ({ children, variant = 'elevated', onClick, className = '' }) => {
  const styles = {
    elevated: "bg-white shadow-sm hover:shadow-2xl transition-all duration-500",
    filled: "bg-gray-50",
    outlined: "bg-white border border-gray-100"
  };
  return (
    <div 
      onClick={onClick}
      className={`rounded-[2.5rem] overflow-hidden ${styles[variant]} ${onClick ? 'cursor-pointer active:scale-[0.99]' : ''} ${className}`}
    >
      {children}
    </div>
  );
};

export const M3Chip: React.FC<{
  label: string;
  selected?: boolean;
  onClick?: React.MouseEventHandler<HTMLButtonElement>;
  icon?: React.ReactNode;
  variant?: 'filter' | 'assist';
}> = ({ label, selected, onClick, icon, variant = 'filter' }) => {
  return (
    <button
      onClick={onClick}
      className={`h-10 px-6 rounded-2xl text-[10px] font-black tracking-widest flex items-center gap-2 border transition-all ${
        selected 
          ? 'bg-[#0A3D91] border-[#0A3D91] text-white shadow-xl shadow-blue-900/10' 
          : 'bg-white border-gray-100 text-gray-500 hover:border-blue-200 hover:bg-blue-50/20'
      }`}
    >
      {icon}
      {label}
    </button>
  );
};

const getDaysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();

export const M3DatePicker: React.FC<{
  value: string; // ISO format (YYYY-MM-DD)
  onChange: (val: string) => void;
  placeholder?: string;
  className?: string;
  required?: boolean;
  name?: string;
  minDate?: string; // ISO
  maxDate?: string; // ISO
  disabled?: boolean;
}> = ({ value, onChange, placeholder, className, required, name = "DatePicker", minDate, maxDate, disabled }) => {
  const [showCalendar, setShowCalendar] = useState(false);
  const [view, setView] = useState<'days' | 'years'>('days');
  const [viewDate, setViewDate] = useState(new Date());
  const [inputValue, setInputValue] = useState('');
  const [internalError, setInternalError] = useState<string | null>(null);
  
  // Sync internal input value with external value
  useEffect(() => {
    const formatted = value ? formatDateDDMMYYYY(value) : '';
    setInputValue(formatted);
  }, [value]);

  useEffect(() => {
    if (showCalendar) {
      const parsed = parseTripDate(value || maxDate || new Date().toISOString());
      if (parsed) setViewDate(parsed);
      setView('days');
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => { document.body.style.overflow = 'unset'; };
  }, [showCalendar, value, maxDate]);

  const handleDayClick = (day: number) => {
    const d = new Date(viewDate.getFullYear(), viewDate.getMonth(), day);
    const iso = toISODate(formatDateDDMMYYYY(d));
    onChange(iso);
    setInternalError(null);
    setShowCalendar(false);
  };

  const changeMonth = (offset: number) => {
    setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + offset, 1));
  };

  const handleYearSelect = (year: number) => {
    setViewDate(new Date(year, viewDate.getMonth(), 1));
    setView('days');
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value.replace(/\D/g, '');
    if (val.length > 8) val = val.substring(0, 8);
    
    let formatted = val;
    if (val.length > 2) formatted = val.substring(0, 2) + '/' + val.substring(2);
    if (val.length > 4) formatted = val.substring(0, 2) + '/' + val.substring(2, 4) + '/' + val.substring(4);
    
    setInputValue(formatted);

    if (formatted.length === 10) {
      if (isValidDDMMYYYY(formatted)) {
        onChange(toISODate(formatted));
        setInternalError(null);
      } else {
        setInternalError('Invalid date');
      }
    } else {
      setInternalError(null);
    }
  };

  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  const daysInMonth = getDaysInMonth(viewDate.getFullYear(), viewDate.getMonth());
  const firstDayOfMonth = new Date(viewDate.getFullYear(), viewDate.getMonth(), 1).getDay();
  
  // Year range for picker
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 100 }, (_, i) => currentYear - 99 + i).reverse();

  return (
    <div className={`relative w-full ${disabled ? 'pointer-events-none' : ''}`}>
      <div className="relative flex flex-col gap-1">
        <div className="relative flex items-center">
          <input
            type="text"
            required={required}
            placeholder={placeholder}
            value={inputValue}
            onChange={handleInputChange}
            className={`${className} pr-12 focus:ring-2 focus:ring-[#0A3D91] ${internalError ? 'border-red-500' : ''}`}
            autoComplete="off"
            maxLength={10}
          />
          <button 
            type="button"
            onClick={() => setShowCalendar(true)}
            className={`absolute right-4 ${disabled ? 'opacity-40' : 'text-gray-300'} hover:text-[#0A3D91] transition-colors`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </button>
        </div>
        {internalError && (
          <span className="text-[9px] font-black text-red-500 uppercase tracking-widest ml-2 italic">
            {internalError}
          </span>
        )}
      </div>

      {showCalendar && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-6">
          <div className="absolute inset-0 bg-[#001A40]/60 backdrop-blur-sm" onClick={() => setShowCalendar(false)} />
          
          <div className="relative bg-white border border-gray-100 shadow-2xl rounded-[2.5rem] p-8 w-full max-w-sm animate-in zoom-in-95 duration-200">
            {view === 'days' ? (
              <>
                <div className="flex items-center justify-between mb-8">
                  <button type="button" onClick={() => changeMonth(-1)} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                    <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7"/></svg>
                  </button>
                  <button 
                    type="button"
                    onClick={() => setView('years')}
                    className="px-4 py-2 hover:bg-gray-50 rounded-xl transition-all group"
                  >
                    <span className="text-[11px] font-black tracking-[0.2em] text-[#0A3D91] group-hover:text-blue-700 flex items-center gap-2">
                      {monthNames[viewDate.getMonth()]} {viewDate.getFullYear()}
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M19 9l-7 7-7-7"/></svg>
                    </span>
                  </button>
                  <button type="button" onClick={() => changeMonth(1)} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                    <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7"/></svg>
                  </button>
                </div>

                <div className="grid grid-cols-7 gap-1 text-center mb-4">
                  {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map(d => (
                    <span key={d} className="text-[9px] font-black text-gray-300 py-2 uppercase">{d}</span>
                  ))}
                  {Array.from({ length: firstDayOfMonth }).map((_, i) => <div key={`empty-${i}`} />)}
                  {Array.from({ length: daysInMonth }).map((_, i) => {
                    const day = i + 1;
                    const d = new Date(viewDate.getFullYear(), viewDate.getMonth(), day);
                    const isoStr = toISODate(formatDateDDMMYYYY(d));
                    const isToday = new Date().toDateString() === d.toDateString();
                    const isSelected = value === isoStr;
                    const isInvalid = (minDate && isoStr < minDate) || (maxDate && isoStr > maxDate);

                    return (
                      <button
                        key={day}
                        type="button"
                        disabled={isInvalid}
                        onClick={() => handleDayClick(day)}
                        className={`h-10 w-10 text-[11px] font-bold rounded-xl transition-all flex items-center justify-center ${
                          isSelected ? 'bg-[#0A3D91] text-white shadow-lg' : 
                          isToday ? 'bg-blue-50 text-[#0A3D91] border border-blue-100' : 
                          isInvalid ? 'opacity-10 cursor-not-allowed' : 'hover:bg-gray-50 text-gray-600'
                        }`}
                      >
                        {day}
                      </button>
                    );
                  })}
                </div>
              </>
            ) : (
              <div className="space-y-6">
                <div className="flex items-center justify-between border-b border-gray-100 pb-4">
                  <h3 className="text-[11px] font-black tracking-[0.2em] text-gray-400">Select Year</h3>
                  <button onClick={() => setView('days')} className="text-[9px] font-black tracking-widest text-[#0A3D91]">Back to days</button>
                </div>
                <div className="grid grid-cols-3 gap-2 h-64 overflow-y-auto pr-2 no-scrollbar">
                  {years.map(y => (
                    <button
                      key={y}
                      onClick={() => handleYearSelect(y)}
                      className={`py-3 rounded-xl text-sm font-bold transition-all ${
                        y === viewDate.getFullYear() ? 'bg-[#0A3D91] text-white shadow-lg' : 'hover:bg-gray-50 text-gray-600'
                      }`}
                    >
                      {y}
                    </button>
                  ))}
                </div>
              </div>
            )}
            
            <button 
              type="button"
              onClick={() => setShowCalendar(false)}
              className="w-full mt-6 py-4 text-[10px] font-black uppercase text-gray-400 hover:text-red-500 tracking-widest transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
};