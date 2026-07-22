export interface ScheduleInput {
  title: string;
  dateISO: string;
  hasTime: boolean;
  url?: string;
}

const TRIGGER_LINE = "予定";
const TIMEZONE_OFFSET = "+09:00";

const LABEL_PATTERNS: { key: "title" | "date" | "url"; pattern: RegExp }[] = [
  { key: "title", pattern: /^タイトル[:：]\s*(.+)$/ },
  { key: "date", pattern: /^日時[:：]\s*(.+)$/ },
  { key: "url", pattern: /^リンク[:：]\s*(.+)$/ },
];

/**
 * "YYYY-MM-DD HH:mm" または "YYYY-MM-DD" のプレーンテキストをISO8601に変換する。
 * 不正な形式・存在しない日付の場合はnullを返す。
 */
export function parsePlainDate(text: string): { dateISO: string; hasTime: boolean } | null {
  const trimmed = text.trim();

  const withTime = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2})$/);
  if (withTime) {
    const [, y, m, d, hh, mm] = withTime;
    if (!isValidDate(y, m, d) || !isValidTime(hh, mm)) return null;
    return { dateISO: `${y}-${m}-${d}T${hh}:${mm}:00${TIMEZONE_OFFSET}`, hasTime: true };
  }

  const dateOnly = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (dateOnly) {
    const [, y, m, d] = dateOnly;
    if (!isValidDate(y, m, d)) return null;
    return { dateISO: `${y}-${m}-${d}`, hasTime: false };
  }

  return null;
}

function isValidDate(y: string, m: string, d: string): boolean {
  const year = Number(y);
  const month = Number(m);
  const day = Number(d);
  if (month < 1 || month > 12 || day < 1 || day > 31) return false;
  const date = new Date(Date.UTC(year, month - 1, day));
  return (
    date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day
  );
}

function isValidTime(hh: string, mm: string): boolean {
  const hour = Number(hh);
  const minute = Number(mm);
  return hour >= 0 && hour <= 23 && minute >= 0 && minute <= 59;
}

/**
 * LINEメッセージが「予定」フォーマットかどうかを判定し、該当すればタイトル・日時・
 * リンクを抽出する純粋関数（外部通信なし）。
 * 1行目が「予定」でない、またはタイトル・日時のいずれかが欠ける/不正な場合はnullを返し、
 * 呼び出し側は「全体感想」への投稿として扱う。
 */
export function parseScheduleMessage(text: string): ScheduleInput | null {
  const lines = text.split(/\r?\n/).map((line) => line.trim());
  if (lines.length === 0 || lines[0] !== TRIGGER_LINE) {
    return null;
  }

  let title: string | undefined;
  let dateText: string | undefined;
  let url: string | undefined;

  for (const line of lines.slice(1)) {
    if (!line) continue;
    for (const { key, pattern } of LABEL_PATTERNS) {
      const match = line.match(pattern);
      if (!match) continue;
      const value = match[1].trim();
      if (key === "title") title = value;
      else if (key === "date") dateText = value;
      else if (key === "url") url = value;
    }
  }

  if (!title || !dateText) {
    return null;
  }

  const parsedDate = parsePlainDate(dateText);
  if (!parsedDate) {
    return null;
  }

  return { title, dateISO: parsedDate.dateISO, hasTime: parsedDate.hasTime, url };
}
