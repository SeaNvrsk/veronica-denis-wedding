/** Везде в приложении время фиксируем по Москве */
const TZ_MOSCOW = "Europe/Moscow";

/** Текущий момент (для логики обратного отсчёта по Москве) */
export function getNowMoscow(): Date {
  const str = new Date().toLocaleString("en-CA", { timeZone: TZ_MOSCOW });
  return new Date(str);
}

/** Форматирование даты/времени по Москве */
export function formatInMoscow(
  date: Date | string,
  options: Intl.DateTimeFormatOptions = {}
): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleString("ru-RU", { timeZone: TZ_MOSCOW, ...options });
}

export function formatDateMoscow(
  date: Date | string,
  options: Intl.DateTimeFormatOptions = {}
): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("ru-RU", { timeZone: TZ_MOSCOW, ...options });
}
