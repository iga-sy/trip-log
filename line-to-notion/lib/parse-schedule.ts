export interface ScheduleInput {
  title: string;
  dateISO: string;
  hasTime: boolean;
  url?: string;
}

const TRIGGER_LINE = "予定";
const TIMEZONE_OFFSET = "+09:00";

const LABEL_PATTERNS: { key: "title" | "date"; pattern: RegExp }[] = [
  { key: "title", pattern: /^タイトル[:：]\s*(.+)$/ },
  { key: "date", pattern: /^日時[:：]\s*(.+)$/ },
];

const URL_PATTERN = /https?:\/\/\S+/;

function pad(value: string): string {
  return value.padStart(2, "0");
}

/**
 * "YYYY-MM-DD HH:mm" 等のプレーンテキストをISO8601に変換する。
 * 区切り文字はハイフン・スラッシュどちらも可、月日・時分は1桁でもよい
 * （食べログ等からコピーした "2025/4/29 11:26" のような表記に対応するため）。
 * 不正な形式・存在しない日付の場合はnullを返す。
 */
export function parsePlainDate(text: string): { dateISO: string; hasTime: boolean } | null {
  const trimmed = text.trim();

  const withTime = trimmed.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})[ T](\d{1,2}):(\d{1,2})$/);
  if (withTime) {
    const [, y, m, d, hh, mm] = withTime;
    if (!isValidDate(y, m, d) || !isValidTime(hh, mm)) return null;
    return {
      dateISO: `${y}-${pad(m)}-${pad(d)}T${pad(hh)}:${pad(mm)}:00${TIMEZONE_OFFSET}`,
      hasTime: true,
    };
  }

  const dateOnly = trimmed.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})$/);
  if (dateOnly) {
    const [, y, m, d] = dateOnly;
    if (!isValidDate(y, m, d)) return null;
    return { dateISO: `${y}-${pad(m)}-${pad(d)}`, hasTime: false };
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
 * リンクはラベル指定ではなく、メッセージ全体からhttp(s)://で始まる文字列を自動検出する
 * （食べログ等のページ情報をそのまま貼り付けた場合、URLがラベル行以外にあることが多いため）。
 */
export function parseScheduleMessage(text: string): ScheduleInput | null {
  const lines = text.split(/\r?\n/).map((line) => line.trim());
  if (lines.length === 0 || lines[0] !== TRIGGER_LINE) {
    return null;
  }

  let title: string | undefined;
  let dateText: string | undefined;

  for (const line of lines.slice(1)) {
    if (!line) continue;
    for (const { key, pattern } of LABEL_PATTERNS) {
      const match = line.match(pattern);
      if (!match) continue;
      const value = match[1].trim();
      if (key === "title") title = value;
      else if (key === "date") dateText = value;
    }
  }

  if (!title || !dateText) {
    return null;
  }

  const parsedDate = parsePlainDate(dateText);
  if (!parsedDate) {
    return null;
  }

  const urlMatch = text.match(URL_PATTERN);
  const url = urlMatch ? urlMatch[0] : undefined;

  return { title, dateISO: parsedDate.dateISO, hasTime: parsedDate.hasTime, url };
}
