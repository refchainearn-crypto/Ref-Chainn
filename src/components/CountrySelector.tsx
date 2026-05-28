import React, { useState } from "react";
import { ChevronDown } from "lucide-react";

export interface Country {
  name: string;
  code: string;
  flag: string;
}

export const COUNTRIES: Country[] = [
  { name: "Nepal", code: "+977", flag: "🇳🇵" },
  { name: "India", code: "+91", flag: "🇮🇳" },
  { name: "United States", code: "+1", flag: "🇺🇸" },
  { name: "United Kingdom", code: "+44", flag: "🇬🇧" },
  { name: "Australia", code: "+61", flag: "🇦🇺" },
  { name: "United Arab Emirates", code: "+971", flag: "🇦🇪" },
  { name: "Singapore", code: "+65", flag: "🇸🇬" },
  { name: "Qatar", code: "+974", flag: "🇶🇦" }
];

interface CountrySelectorProps {
  selectedCode: string;
  onChange: (code: string) => void;
  darkMode: boolean;
}

export const CountrySelector: React.FC<CountrySelectorProps> = ({ selectedCode, onChange, darkMode }) => {
  const [isOpen, setIsOpen] = useState(false);
  const activeCountry = COUNTRIES.find(c => c.code === selectedCode) || COUNTRIES[0];

  return (
    <div className="relative">
      <button
        id="country-selector-btn"
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-2 px-3 h-12 rounded-xl border text-sm font-medium transition-all ${
          darkMode 
            ? "bg-slate-900 border-slate-700 hover:border-slate-500 text-white" 
            : "bg-white border-gray-300 hover:border-gray-400 text-gray-800"
        }`}
      >
        <span>{activeCountry.flag}</span>
        <span>{activeCountry.code}</span>
        <ChevronDown size={14} className="opacity-60" />
      </button>

      {isOpen && (
        <>
          <div 
            id="country-selector-backdrop"
            className="fixed inset-0 z-10" 
            onClick={() => setIsOpen(false)} 
          />
          <div
            id="country-selector-dropdown"
            className={`absolute left-0 mt-1 w-52 rounded-xl shadow-xl border p-1 z-20 max-h-60 overflow-y-auto transition-all ${
              darkMode 
                ? "bg-slate-950 border-slate-850 text-slate-200" 
                : "bg-white border-gray-200 text-gray-700"
            }`}
          >
            {COUNTRIES.map((country) => (
              <button
                id={`country-opt-${country.code.replace('+', '')}`}
                key={country.code}
                type="button"
                onClick={() => {
                  onChange(country.code);
                  setIsOpen(false);
                }}
                className={`flex items-center justify-between w-full px-3 py-2 text-xs rounded-lg text-left transition-colors ${
                  selectedCode === country.code 
                    ? darkMode ? "bg-emerald-950 text-emerald-300" : "bg-emerald-50 text-emerald-700 font-semibold"
                    : darkMode ? "hover:bg-slate-800 text-slate-300" : "hover:bg-gray-105 text-gray-800"
                }`}
              >
                <div className="flex items-center gap-2">
                  <span>{country.flag}</span>
                  <span>{country.name}</span>
                </div>
                <span className="font-mono opacity-60">{country.code}</span>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
};
