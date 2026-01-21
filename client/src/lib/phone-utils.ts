export interface Country {
  code: string;
  name: string;
  dialCode: string;
  flag: string;
  format: string;
}

export const COUNTRIES: Country[] = [
  { code: "CH", name: "Schweiz", dialCode: "+41", flag: "🇨🇭", format: "+41 XX XXX XX XX" },
  { code: "DE", name: "Deutschland", dialCode: "+49", flag: "🇩🇪", format: "+49 XXX XXXXXXX" },
  { code: "AT", name: "Österreich", dialCode: "+43", flag: "🇦🇹", format: "+43 X XXXXXXXX" },
  { code: "FR", name: "Frankreich", dialCode: "+33", flag: "🇫🇷", format: "+33 X XX XX XX XX" },
  { code: "IT", name: "Italien", dialCode: "+39", flag: "🇮🇹", format: "+39 XXX XXX XXXX" },
  { code: "LI", name: "Liechtenstein", dialCode: "+423", flag: "🇱🇮", format: "+423 XXX XX XX" },
  { code: "NL", name: "Niederlande", dialCode: "+31", flag: "🇳🇱", format: "+31 X XXXXXXXX" },
  { code: "BE", name: "Belgien", dialCode: "+32", flag: "🇧🇪", format: "+32 XXX XX XX XX" },
  { code: "LU", name: "Luxemburg", dialCode: "+352", flag: "🇱🇺", format: "+352 XXX XXX XXX" },
  { code: "GB", name: "Vereinigtes Königreich", dialCode: "+44", flag: "🇬🇧", format: "+44 XXXX XXXXXX" },
  { code: "US", name: "Vereinigte Staaten", dialCode: "+1", flag: "🇺🇸", format: "+1 XXX XXX XXXX" },
];

export function formatPhoneNumber(phone: string, countryCode: string): string {
  const digits = phone.replace(/\D/g, '');
  
  if (!digits) return '';

  const country = COUNTRIES.find(c => c.code === countryCode);
  if (!country) return phone;

  const dialCodeDigits = country.dialCode.replace(/\D/g, '');
  
  let nationalNumber = digits;
  if (digits.startsWith(dialCodeDigits)) {
    nationalNumber = digits.slice(dialCodeDigits.length);
  } else if (digits.startsWith('0')) {
    nationalNumber = digits.slice(1);
  }

  switch (countryCode) {
    case "CH": {
      const parts = [];
      if (nationalNumber.length > 0) parts.push(nationalNumber.slice(0, 2));
      if (nationalNumber.length > 2) parts.push(nationalNumber.slice(2, 5));
      if (nationalNumber.length > 5) parts.push(nationalNumber.slice(5, 7));
      if (nationalNumber.length > 7) parts.push(nationalNumber.slice(7, 9));
      return `${country.dialCode} ${parts.join(' ')}`.trim();
    }
    case "DE": {
      const parts = [];
      if (nationalNumber.length > 0) parts.push(nationalNumber.slice(0, 3));
      if (nationalNumber.length > 3) parts.push(nationalNumber.slice(3));
      return `${country.dialCode} ${parts.join(' ')}`.trim();
    }
    case "AT": {
      const parts = [];
      if (nationalNumber.length > 0) parts.push(nationalNumber.slice(0, 1));
      if (nationalNumber.length > 1) parts.push(nationalNumber.slice(1));
      return `${country.dialCode} ${parts.join(' ')}`.trim();
    }
    case "FR": {
      const parts = [];
      if (nationalNumber.length > 0) parts.push(nationalNumber.slice(0, 1));
      for (let i = 1; i < nationalNumber.length; i += 2) {
        parts.push(nationalNumber.slice(i, i + 2));
      }
      return `${country.dialCode} ${parts.join(' ')}`.trim();
    }
    case "IT": {
      const parts = [];
      if (nationalNumber.length > 0) parts.push(nationalNumber.slice(0, 3));
      if (nationalNumber.length > 3) parts.push(nationalNumber.slice(3, 6));
      if (nationalNumber.length > 6) parts.push(nationalNumber.slice(6, 10));
      return `${country.dialCode} ${parts.join(' ')}`.trim();
    }
    case "US": {
      const parts = [];
      if (nationalNumber.length > 0) parts.push(nationalNumber.slice(0, 3));
      if (nationalNumber.length > 3) parts.push(nationalNumber.slice(3, 6));
      if (nationalNumber.length > 6) parts.push(nationalNumber.slice(6, 10));
      return `${country.dialCode} ${parts.join(' ')}`.trim();
    }
    case "GB": {
      const parts = [];
      if (nationalNumber.length > 0) parts.push(nationalNumber.slice(0, 4));
      if (nationalNumber.length > 4) parts.push(nationalNumber.slice(4, 10));
      return `${country.dialCode} ${parts.join(' ')}`.trim();
    }
    default: {
      return `${country.dialCode} ${nationalNumber}`.trim();
    }
  }
}

export function detectCountryFromPhone(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  
  for (const country of COUNTRIES) {
    const dialCodeDigits = country.dialCode.replace(/\D/g, '');
    if (digits.startsWith(dialCodeDigits)) {
      return country.code;
    }
  }
  
  return "CH";
}
