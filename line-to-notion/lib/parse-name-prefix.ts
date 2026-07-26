export const FAMILY_MEMBERS = ["修", "美", "悠", "紗"] as const;
export type FamilyMember = (typeof FAMILY_MEMBERS)[number];

export interface NamePrefixResult {
  name: FamilyMember | null;
  text: string;
}

/**
 * LINEメッセージの先頭が「修:」「美:」「紗:」「悠:」（全角・半角コロン対応）で
 * 始まっていれば、その名前を抽出しプレフィックスを除いた本文を返す純粋関数。
 * 一致しなければ name は null、text は元のテキストそのまま。
 */
export function parseNamePrefix(text: string): NamePrefixResult {
  for (const name of FAMILY_MEMBERS) {
    const pattern = new RegExp(`^${name}[:：]\\s*`);
    const match = text.match(pattern);
    if (match) {
      return { name, text: text.slice(match[0].length) };
    }
  }
  return { name: null, text };
}
