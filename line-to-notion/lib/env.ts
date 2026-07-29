export function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`環境変数 ${name} が設定されていません`);
  }
  return value;
}

/**
 * カンマ区切りの旅行名リストをパースする。先頭がメッセージに旅行名の
 * 指定が無かったときのデフォルト旅行として扱われる。
 */
export function parseTripNames(raw: string): string[] {
  return raw
    .split(",")
    .map((name) => name.trim())
    .filter((name) => name.length > 0);
}
