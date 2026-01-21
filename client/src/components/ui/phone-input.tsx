import { useState, useEffect, useRef } from "react";
import { ChevronDown } from "lucide-react";
import { Input } from "@/components/ui/input";
import { COUNTRIES, formatPhoneNumber, detectCountryFromPhone, Country } from "@/lib/phone-utils";
import { cn } from "@/lib/utils";

interface PhoneInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  "data-testid"?: string;
}

export function PhoneInput({ value, onChange, placeholder = "Telefon", className, "data-testid": testId }: PhoneInputProps) {
  const [countryCode, setCountryCode] = useState<string>("CH");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [rawInput, setRawInput] = useState(value);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (value !== rawInput) {
      if (value) {
        const detected = detectCountryFromPhone(value);
        setCountryCode(detected);
      }
      setRawInput(value);
    }
  }, [value]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    setRawInput(inputValue);
    
    if (inputValue.trim()) {
      const formatted = formatPhoneNumber(inputValue, countryCode);
      onChange(formatted);
    } else {
      onChange("");
    }
  };

  const handleInputBlur = () => {
    if (rawInput.trim()) {
      const formatted = formatPhoneNumber(rawInput, countryCode);
      setRawInput(formatted);
      onChange(formatted);
    }
  };

  const handleCountrySelect = (country: Country) => {
    setCountryCode(country.code);
    setDropdownOpen(false);
    
    if (rawInput.trim()) {
      const formatted = formatPhoneNumber(rawInput, country.code);
      setRawInput(formatted);
      onChange(formatted);
    }
    
    inputRef.current?.focus();
  };

  const selectedCountry = COUNTRIES.find(c => c.code === countryCode) || COUNTRIES[0];

  return (
    <div className={cn("relative flex", className)} ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setDropdownOpen(!dropdownOpen)}
        className="flex items-center gap-1.5 px-3 h-9 border border-r-0 border-input rounded-l-md bg-muted/50 hover:bg-muted transition-colors text-sm"
        aria-haspopup="listbox"
        aria-expanded={dropdownOpen}
        data-testid={testId ? `${testId}-country-select` : "phone-country-select"}
      >
        <span className="text-xl leading-none">{selectedCountry.flag}</span>
        <span className="text-xs font-medium text-gray-600">{selectedCountry.dialCode}</span>
        <ChevronDown className="w-3 h-3 text-muted-foreground" />
      </button>
      
      <Input
        ref={inputRef}
        type="tel"
        value={rawInput}
        onChange={handleInputChange}
        onBlur={handleInputBlur}
        placeholder={placeholder}
        className="rounded-l-none flex-1"
        data-testid={testId}
      />
      
      {dropdownOpen && (
        <div 
          className="absolute top-full left-0 mt-1 w-64 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-60 overflow-y-auto"
          role="listbox"
          aria-label="Land auswählen"
        >
          {COUNTRIES.map((country) => (
            <button
              key={country.code}
              type="button"
              role="option"
              aria-selected={country.code === countryCode}
              onClick={() => handleCountrySelect(country)}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-2.5 hover:bg-gray-50 text-left transition-colors",
                country.code === countryCode && "bg-blue-50"
              )}
              data-testid={`country-option-${country.code}`}
            >
              <span className="text-2xl leading-none">{country.flag}</span>
              <div className="flex-1 min-w-0">
                <div className="font-medium text-gray-900">{country.name}</div>
                <div className="text-xs text-gray-500">{country.dialCode}</div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
