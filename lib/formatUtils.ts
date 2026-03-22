const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

const MONTH_SHORT = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
]

export function monthName(month: number): string {
  return MONTH_NAMES[month - 1] ?? ''
}

export function monthShortName(month: number): string {
  return MONTH_SHORT[month - 1] ?? ''
}

/**
 * Build a human-readable date string from a visit's year/month fields.
 *
 * Examples:
 *   year_start=2012                           → "2012"
 *   month_start=3, year_start=2012            → "March 2012"
 *   month_start=2, year_start=2012,
 *     month_end=6, year_end=2012              → "Feb–Jun 2012"
 *   year_start=2012, year_end=2014            → "2012–2014"
 *   month_start=2, year_start=2012,
 *     month_end=6, year_end=2014              → "Feb 2012 – Jun 2014"
 */
export function formatVisitDate(visit: {
  year_start?: number
  month_start?: number
  year_end?: number
  month_end?: number
}): string {
  const { year_start, month_start, year_end, month_end } = visit
  if (!year_start) return ''

  const hasEnd = year_end != null
  const sameYear = hasEnd && year_end === year_start

  if (!hasEnd) {
    return month_start ? `${monthName(month_start)} ${year_start}` : `${year_start}`
  }

  if (sameYear) {
    if (month_start && month_end) {
      return `${monthShortName(month_start)}–${monthShortName(month_end)} ${year_start}`
    }
    if (month_start) return `${monthName(month_start)} ${year_start}`
    return `${year_start}`
  }

  // Different years
  const startStr = month_start
    ? `${monthShortName(month_start)} ${year_start}`
    : `${year_start}`
  const endStr = month_end
    ? `${monthShortName(month_end)} ${year_end}`
    : `${year_end}`
  return `${startStr}–${endStr}`
}

/** For compact list subtext, e.g. "May, 2025" or "2025" when month is unknown. */
export function formatMonthYearComma(year?: number, month?: number): string {
  if (year == null) return ''
  if (month != null && month >= 1 && month <= 12) {
    return `${monthName(month)}, ${year}`
  }
  return `${year}`
}
