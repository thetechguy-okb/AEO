export type DatePrecision = 'day' | 'month' | 'year';

export interface AmbiguousDateOption {
  label: string;
  normalizedDate: string;
  displayDate: string;
  precision: DatePrecision;
  sortValue: number;
}

export interface ParsedDateResult {
  isValid: boolean;
  isAmbiguous: boolean;
  error?: string;
  rawInput: string;
  normalizedDate: string; // "YYYY-MM-DD" | "YYYY-MM" | "YYYY"
  displayDate: string;    // "21 September 2026" | "September 2026" | "2026"
  precision: DatePrecision;
  sortValue: number;      // e.g. 20260921, 20260900, 20260000
  ambiguousOptions?: AmbiguousDateOption[];
}

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const MONTH_MAP: Record<string, number> = {
  january: 1, jan: 1,
  february: 2, feb: 2,
  march: 3, mar: 3,
  april: 4, apr: 4,
  may: 5,
  june: 6, jun: 6,
  july: 7, jul: 7,
  august: 8, aug: 8,
  september: 9, sep: 9, sept: 9,
  october: 10, oct: 10,
  november: 11, nov: 11,
  december: 12, dec: 12
};

export function daysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate();
}

function pad2(n: number): string {
  return n < 10 ? `0${n}` : `${n}`;
}

export function buildParsedResult(
  year: number,
  month?: number,
  day?: number,
  rawInput: string = ''
): ParsedDateResult {
  // Normalize 2-digit years e.g. 26 -> 2026
  let finalYear = year;
  if (finalYear >= 0 && finalYear <= 99) {
    finalYear = 2000 + finalYear;
  }

  if (finalYear < 1900 || finalYear > 2100) {
    return {
      isValid: false,
      isAmbiguous: false,
      error: `Year ${finalYear} is outside valid range (1900-2100)`,
      rawInput,
      normalizedDate: '',
      displayDate: rawInput,
      precision: 'year',
      sortValue: 0
    };
  }

  if (month === undefined) {
    const normalizedDate = `${finalYear}`;
    const displayDate = `${finalYear}`;
    const sortValue = finalYear * 10000;
    return {
      isValid: true,
      isAmbiguous: false,
      rawInput,
      normalizedDate,
      displayDate,
      precision: 'year',
      sortValue
    };
  }

  if (month < 1 || month > 12) {
    return {
      isValid: false,
      isAmbiguous: false,
      error: `Invalid month number (${month}). Must be 1-12`,
      rawInput,
      normalizedDate: '',
      displayDate: rawInput,
      precision: 'month',
      sortValue: 0
    };
  }

  const monthName = MONTH_NAMES[month - 1];

  if (day === undefined) {
    const normalizedDate = `${finalYear}-${pad2(month)}`;
    const displayDate = `${monthName} ${finalYear}`;
    const sortValue = finalYear * 10000 + month * 100;
    return {
      isValid: true,
      isAmbiguous: false,
      rawInput,
      normalizedDate,
      displayDate,
      precision: 'month',
      sortValue
    };
  }

  const maxDays = daysInMonth(finalYear, month);
  if (day < 1 || day > maxDays) {
    return {
      isValid: false,
      isAmbiguous: false,
      error: `${monthName} ${finalYear} has only ${maxDays} days, but day ${day} was specified`,
      rawInput,
      normalizedDate: '',
      displayDate: rawInput,
      precision: 'day',
      sortValue: 0
    };
  }

  const normalizedDate = `${finalYear}-${pad2(month)}-${pad2(day)}`;
  const displayDate = `${day} ${monthName} ${finalYear}`;
  const sortValue = finalYear * 10000 + month * 100 + day;

  return {
    isValid: true,
    isAmbiguous: false,
    rawInput,
    normalizedDate,
    displayDate,
    precision: 'day',
    sortValue
  };
}

export function parseFlexibleDate(input: any): ParsedDateResult {
  if (input === null || input === undefined || input === '') {
    return {
      isValid: false,
      isAmbiguous: false,
      error: 'Empty date input',
      rawInput: '',
      normalizedDate: '',
      displayDate: '',
      precision: 'day',
      sortValue: 0
    };
  }

  // Handle JS Date object
  if (input instanceof Date) {
    if (isNaN(input.getTime())) {
      return {
        isValid: false,
        isAmbiguous: false,
        error: 'Invalid Date instance',
        rawInput: String(input),
        normalizedDate: '',
        displayDate: '',
        precision: 'day',
        sortValue: 0
      };
    }
    return buildParsedResult(
      input.getFullYear(),
      input.getMonth() + 1,
      input.getDate(),
      input.toISOString()
    );
  }

  // Handle Firestore Timestamp / Object
  if (typeof input === 'object' && input !== null) {
    if (typeof input.seconds === 'number') {
      const d = new Date(input.seconds * 1000);
      return buildParsedResult(
        d.getUTCFullYear(),
        d.getUTCMonth() + 1,
        d.getUTCDate(),
        String(input.seconds)
      );
    }
    if (typeof input.toDate === 'function') {
      try {
        const d = input.toDate();
        if (d instanceof Date && !isNaN(d.getTime())) {
          return buildParsedResult(
            d.getFullYear(),
            d.getMonth() + 1,
            d.getDate(),
            String(input)
          );
        }
      } catch (e) {}
    }
  }

  // Handle Number timestamp
  if (typeof input === 'number') {
    if (isNaN(input) || input <= 0) {
      return {
        isValid: false,
        isAmbiguous: false,
        error: 'Invalid numeric timestamp',
        rawInput: String(input),
        normalizedDate: '',
        displayDate: '',
        precision: 'day',
        sortValue: 0
      };
    }
    const d = new Date(input);
    return buildParsedResult(
      d.getFullYear(),
      d.getMonth() + 1,
      d.getDate(),
      String(input)
    );
  }

  // Process String input
  let str = String(input).trim();
  if (!str) {
    return {
      isValid: false,
      isAmbiguous: false,
      error: 'Empty date string',
      rawInput: '',
      normalizedDate: '',
      displayDate: '',
      precision: 'day',
      sortValue: 0
    };
  }

  // Clean metadata separators e.g. "15 July 2026 · 1.2 MB"
  if (str.includes('·')) str = str.split('·')[0].trim();
  if (str.includes('|')) str = str.split('|')[0].trim();

  // Strip day of week prefix: "Monday, 21 September 2026"
  str = str.replace(/^(monday|tuesday|wednesday|thursday|friday|saturday|sunday)[,\s]+/i, '');

  // Strip ordinal suffixes: "21st" -> "21", "1st" -> "1", "2nd" -> "2", "3rd" -> "3"
  str = str.replace(/\b(\d{1,2})(st|nd|rd|th)\b/gi, '$1');

  // Strip commas between components e.g. "September 21, 2026"
  str = str.replace(/([a-zA-Z0-9]+),\s*(\d{4})/g, '$1 $2');
  str = str.replace(/([a-zA-Z]+),\s*(\d{1,2})/g, '$1 $2');

  // 1. Check Year Only: "2026"
  if (/^\d{4}$/.test(str)) {
    const yr = parseInt(str, 10);
    return buildParsedResult(yr, undefined, undefined, str);
  }

  // 2. Check YYYY-MM or YYYY/MM: e.g. "2026-09", "2026/09"
  const yyyyMm = str.match(/^(\d{4})[\/\.-](\d{1,2})$/);
  if (yyyyMm) {
    const yr = parseInt(yyyyMm[1], 10);
    const mo = parseInt(yyyyMm[2], 10);
    return buildParsedResult(yr, mo, undefined, str);
  }

  // 3. Check MM/YYYY or MM-YYYY: e.g. "09/2026", "09-2026"
  const mmYyyy = str.match(/^(\d{1,2})[\/\.-](\d{4})$/);
  if (mmYyyy) {
    const mo = parseInt(mmYyyy[1], 10);
    const yr = parseInt(mmYyyy[2], 10);
    return buildParsedResult(yr, mo, undefined, str);
  }

  // 4. Check Month Name + Year: e.g. "September 2026", "Sep 2026", "2026 September"
  const monthNameYr = str.match(/^([a-zA-Z]+)\s+(\d{4})$/);
  if (monthNameYr) {
    const mStr = monthNameYr[1].toLowerCase();
    const yr = parseInt(monthNameYr[2], 10);
    if (MONTH_MAP[mStr]) {
      return buildParsedResult(yr, MONTH_MAP[mStr], undefined, str);
    }
  }

  const yrMonthName = str.match(/^(\d{4})\s+([a-zA-Z]+)$/);
  if (yrMonthName) {
    const yr = parseInt(yrMonthName[1], 10);
    const mStr = yrMonthName[2].toLowerCase();
    if (MONTH_MAP[mStr]) {
      return buildParsedResult(yr, MONTH_MAP[mStr], undefined, str);
    }
  }

  // 5. Check YYYY-MM-DD or YYYY/MM/DD: e.g. "2026-09-21" or "2026/09/21"
  const isoMatch = str.match(/^(\d{4})[\/\.-](\d{1,2})[\/\.-](\d{1,2})$/);
  if (isoMatch) {
    const yr = parseInt(isoMatch[1], 10);
    const mo = parseInt(isoMatch[2], 10);
    const dy = parseInt(isoMatch[3], 10);
    return buildParsedResult(yr, mo, dy, str);
  }

  // 6. Check Day + Month Name + Year: e.g. "21 September 2026", "21 Sep 2026", "21-Sep-2026"
  const dmyNamed = str.match(/^(\d{1,2})[\s\.-]+([a-zA-Z]+)[\s\.-]+(\d{4})$/);
  if (dmyNamed) {
    const dy = parseInt(dmyNamed[1], 10);
    const mStr = dmyNamed[2].toLowerCase();
    const yr = parseInt(dmyNamed[3], 10);
    if (MONTH_MAP[mStr]) {
      return buildParsedResult(yr, MONTH_MAP[mStr], dy, str);
    }
  }

  // 7. Check Month Name + Day + Year: e.g. "September 21 2026", "Sep 21 2026"
  const mdyNamed = str.match(/^([a-zA-Z]+)[\s\.-]+(\d{1,2})[\s\.-]+(\d{4})$/);
  if (mdyNamed) {
    const mStr = mdyNamed[1].toLowerCase();
    const dy = parseInt(mdyNamed[2], 10);
    const yr = parseInt(mdyNamed[3], 10);
    if (MONTH_MAP[mStr]) {
      return buildParsedResult(yr, MONTH_MAP[mStr], dy, str);
    }
  }

  // 8. Check Numeric 3-part dates: e.g. "21/09/2026", "09/21/2026", "03/04/2026", "21.09.2026", "21-09-2026"
  const num3Part = str.match(/^(\d{1,2})[\/\.-](\d{1,2})[\/\.-](\d{2,4})$/);
  if (num3Part) {
    const p1 = parseInt(num3Part[1], 10);
    const p2 = parseInt(num3Part[2], 10);
    let yr = parseInt(num3Part[3], 10);
    if (yr >= 0 && yr <= 99) {
      yr = 2000 + yr;
    }

    const p1ValidAsMonth = p1 >= 1 && p1 <= 12;
    const p2ValidAsMonth = p2 >= 1 && p2 <= 12;

    const p1ValidAsDayForP2 = p2ValidAsMonth && p1 >= 1 && p1 <= daysInMonth(yr, p2);
    const p2ValidAsDayForP1 = p1ValidAsMonth && p2 >= 1 && p2 <= daysInMonth(yr, p1);

    // Case A: Both interpretations are valid and produce DIFFERENT results! (e.g. 03/04/2026)
    if (p1ValidAsDayForP2 && p2ValidAsDayForP1 && p1 !== p2) {
      const opt1 = buildParsedResult(yr, p2, p1, str); // DD/MM/YYYY: p1=day, p2=month
      const opt2 = buildParsedResult(yr, p1, p2, str); // MM/DD/YYYY: p1=month, p2=day

      return {
        isValid: true,
        isAmbiguous: true,
        rawInput: str,
        normalizedDate: opt1.normalizedDate,
        displayDate: opt1.displayDate,
        precision: 'day',
        sortValue: opt1.sortValue,
        ambiguousOptions: [
          {
            label: `${opt1.displayDate} (DD/MM/YYYY)`,
            normalizedDate: opt1.normalizedDate,
            displayDate: opt1.displayDate,
            precision: opt1.precision,
            sortValue: opt1.sortValue
          },
          {
            label: `${opt2.displayDate} (MM/DD/YYYY)`,
            normalizedDate: opt2.normalizedDate,
            displayDate: opt2.displayDate,
            precision: opt2.precision,
            sortValue: opt2.sortValue
          }
        ]
      };
    }

    // Case B: Only DD/MM/YYYY is valid (e.g. 21/09/2026)
    if (p1ValidAsDayForP2) {
      return buildParsedResult(yr, p2, p1, str);
    }

    // Case C: Only MM/DD/YYYY is valid (e.g. 09/21/2026)
    if (p2ValidAsDayForP1) {
      return buildParsedResult(yr, p1, p2, str);
    }

    // Neither is valid
    return {
      isValid: false,
      isAmbiguous: false,
      error: `Invalid day/month combination (${p1}, ${p2}) for year ${yr}`,
      rawInput: str,
      normalizedDate: '',
      displayDate: str,
      precision: 'day',
      sortValue: 0
    };
  }

  // 9. Quarters & Relative strings e.g. "Q3 2026", "Late 2026"
  const qMatch = str.match(/^Q([1-4])\s+(\d{4})$/i);
  if (qMatch) {
    const q = parseInt(qMatch[1], 10);
    const yr = parseInt(qMatch[2], 10);
    const month = (q - 1) * 3 + 1;
    return buildParsedResult(yr, month, undefined, str);
  }

  // Fallback Native Date Parse
  const fallbackTs = Date.parse(str);
  if (!isNaN(fallbackTs)) {
    const d = new Date(fallbackTs);
    return buildParsedResult(d.getFullYear(), d.getMonth() + 1, d.getDate(), str);
  }

  return {
    isValid: false,
    isAmbiguous: false,
    error: `Unrecognized date format "${str}"`,
    rawInput: str,
    normalizedDate: '',
    displayDate: str,
    precision: 'day',
    sortValue: 0
  };
}

export function normalizeDate(input: any): string {
  const parsed = parseFlexibleDate(input);
  return parsed.isValid ? parsed.normalizedDate : String(input || '');
}

export function getDatePrecision(input: any): DatePrecision {
  const parsed = parseFlexibleDate(input);
  return parsed.precision;
}

export function getDateSortValue(input: any): number {
  if (!input) return 0;

  if (typeof input === 'object' && input !== null) {
    if (typeof input.sortValue === 'number' && input.sortValue > 0) {
      return input.sortValue;
    }
    if (typeof input.dateSortValue === 'number' && input.dateSortValue > 0) {
      return input.dateSortValue;
    }

    const target = input.originalItem || input;

    if (target.normalizedDate) {
      const parsed = parseFlexibleDate(target.normalizedDate);
      if (parsed.isValid) return parsed.sortValue;
    }

    const primaryVal = target.publicationDate || target.publishedAt || target.date || input.date;
    if (primaryVal) {
      const parsed = parseFlexibleDate(primaryVal);
      if (parsed.isValid) return parsed.sortValue;
    }

    if (target.createdAt || input.createdAt) {
      const parsed = parseFlexibleDate(target.createdAt || input.createdAt);
      if (parsed.isValid) return parsed.sortValue;
    }
  }

  const parsed = parseFlexibleDate(input);
  return parsed.isValid ? parsed.sortValue : 0;
}

export function formatDisplayDate(input: any): string {
  if (!input) return '';
  const parsed = parseFlexibleDate(input);
  return parsed.isValid ? parsed.displayDate : String(input);
}

export function formatReportDate(dateStr: any): string {
  return formatDisplayDate(dateStr);
}

export function parseDateValue(dateVal: any): number {
  if (!dateVal) return 0;
  const parsed = parseFlexibleDate(dateVal);
  if (parsed.isValid) {
    if (parsed.precision === 'day') {
      const parts = parsed.normalizedDate.split('-').map(Number);
      return Date.UTC(parts[0], parts[1] - 1, parts[2]);
    } else if (parsed.precision === 'month') {
      const parts = parsed.normalizedDate.split('-').map(Number);
      return Date.UTC(parts[0], parts[1] - 1, 1);
    } else {
      return Date.UTC(Number(parsed.normalizedDate), 0, 1);
    }
  }
  return 0;
}

export function getPublicationTimestamp(item: any): number {
  return getDateSortValue(item);
}

export function compareDates(a: any, b: any, direction: 'asc' | 'desc' = 'desc'): number {
  const sA = getDateSortValue(a);
  const sB = getDateSortValue(b);

  if (sA !== sB) {
    return direction === 'desc' ? sB - sA : sA - sB;
  }

  const cA = parseDateValue(a?.originalItem?.createdAt || a?.createdAt || a?.publishedAt);
  const cB = parseDateValue(b?.originalItem?.createdAt || b?.createdAt || b?.publishedAt);
  if (cA !== cB) {
    return direction === 'desc' ? cB - cA : cA - cB;
  }

  const idA = String(a?.id || a?.title || a?.name || '');
  const idB = String(b?.id || b?.title || b?.name || '');
  return idA.localeCompare(idB);
}

export function sortItemsByDate<T>(
  items: T[],
  dateField?: keyof T | string,
  direction: 'asc' | 'desc' = 'desc'
): T[] {
  if (!Array.isArray(items)) return [];
  return [...items].sort((a: any, b: any) => {
    let sA = 0;
    let sB = 0;

    if (dateField && typeof dateField === 'string' && dateField !== 'date') {
      sA = (a && a[dateField] ? getDateSortValue(a[dateField]) : 0) || getDateSortValue(a);
      sB = (b && b[dateField] ? getDateSortValue(b[dateField]) : 0) || getDateSortValue(b);
    } else {
      sA = getDateSortValue(a);
      sB = getDateSortValue(b);
    }

    if (sA !== sB) {
      return direction === 'desc' ? sB - sA : sA - sB;
    }

    const cA = parseDateValue(a?.originalItem?.createdAt || a?.createdAt || a?.publishedAt);
    const cB = parseDateValue(b?.originalItem?.createdAt || b?.createdAt || b?.publishedAt);
    if (cA !== cB) {
      return direction === 'desc' ? cB - cA : cA - cB;
    }

    const titleA = String(a?.title || a?.name || a?.id || '');
    const titleB = String(b?.title || b?.name || b?.id || '');
    return titleA.localeCompare(titleB);
  });
}
