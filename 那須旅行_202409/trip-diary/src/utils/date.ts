const WEEKDAYS = ["日", "月", "火", "水", "木", "金", "土"];

export function dayKey(dateISO: string): string {
  return dateISO.slice(0, 10);
}

export function formatDayHeading(dateISO: string): string {
  const date = new Date(dateISO);
  const weekday = WEEKDAYS[date.getDay()];
  return `${date.getMonth() + 1}月${date.getDate()}日（${weekday}）`;
}

export function formatTime(dateISO: string): string {
  const date = new Date(dateISO);
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  return `${hours}:${minutes}`;
}
