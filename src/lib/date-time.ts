const DEFAULT_LOCALE = "es-MX";
export const MEXICO_TIME_ZONE = "America/Mexico_City";

export function formatDateTimeMx(
  value: string | Date,
  options?: Intl.DateTimeFormatOptions,
  locale = DEFAULT_LOCALE,
) {
  const date = value instanceof Date ? value : new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return new Intl.DateTimeFormat(locale, {
    timeZone: MEXICO_TIME_ZONE,
    ...options,
  }).format(date);
}
