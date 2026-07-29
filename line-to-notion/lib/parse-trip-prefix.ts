export interface TripPrefixResult {
  tripName: string | null;
  text: string;
}

const TRIP_PREFIX_PATTERN = /^\[(.+?)\]\s*/;

/**
 * 「全体感想」向けメッセージの先頭が `[旅行名]` であれば、その旅行名を抽出し
 * プレフィックスを除いた本文を返す純粋関数。
 * 複数の旅行が並行して進んでいるときだけ明示的に指定すればよく、
 * 省略時（プレフィックスが無いとき）はtripNameがnullになるので、
 * 呼び出し側でデフォルトの旅行名を適用する。
 */
export function parseTripPrefix(text: string): TripPrefixResult {
  const match = text.match(TRIP_PREFIX_PATTERN);
  if (match) {
    return { tripName: match[1].trim(), text: text.slice(match[0].length) };
  }
  return { tripName: null, text };
}
