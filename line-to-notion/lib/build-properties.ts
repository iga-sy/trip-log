import type { NotionFileUpload } from "./notion-write.js";
import type { FamilyMember } from "./parse-name-prefix.js";

// 実際の「全体感想」データベースの構成に合わせる。
// title列の名前は「投稿者」だが実際には旅行名などに使う予定のタイトル型プロパティのため、
// LINEからは常に空のまま作成する。投稿者本人（誰が書いたか）は「マルチセレクト」列に入れる。
export const COMMENTS_DB_PROPERTY_NAMES = {
  title: "投稿者",
  author: "マルチセレクト",
  text: "メモ",
  photos: "写真",
} as const;

export interface BuildCommentPropertiesInput {
  name: FamilyMember | null;
  text: string;
  fileUploads: NotionFileUpload[];
}

/**
 * LINEから受け取った名前プレフィックス判定結果・本文・アップロード済み画像を、
 * Notion pages.create の properties オブジェクトに変換する純粋関数。
 * 外部通信を行わないため、モック無しで単体テストできる。
 */
export function buildCommentProperties(
  input: BuildCommentPropertiesInput,
): Record<string, unknown> {
  const properties: Record<string, unknown> = {
    [COMMENTS_DB_PROPERTY_NAMES.title]: { title: [] },
    [COMMENTS_DB_PROPERTY_NAMES.author]: {
      multi_select: input.name ? [{ name: input.name }] : [],
    },
    [COMMENTS_DB_PROPERTY_NAMES.text]: {
      rich_text: input.text ? [{ text: { content: input.text } }] : [],
    },
  };

  if (input.fileUploads.length > 0) {
    properties[COMMENTS_DB_PROPERTY_NAMES.photos] = {
      files: input.fileUploads.map((f) => ({
        type: "file_upload",
        file_upload: { id: f.id },
        name: f.name,
      })),
    };
  }

  return properties;
}

// trip-diaryのfetch-notion.tsのPROPERTY_NAMESと一致させる（「メモ」「コメント(修/美/悠/紗)」は
// LINEからは書き込まないためここには含めない＝プロパティごと送信せず空欄のまま作成される）
export const SCHEDULE_DB_PROPERTY_NAMES = {
  title: "タイトル",
  date: "日時",
  url: "お店リンク",
  photos: "写真",
} as const;

export interface BuildSchedulePropertiesInput {
  title: string;
  dateISO: string;
  hasTime: boolean;
  url?: string;
  fileUploads: NotionFileUpload[];
}

/**
 * parseScheduleMessageの抽出結果を、Notion pages.create の properties オブジェクトに
 * 変換する純粋関数。外部通信を行わないため、モック無しで単体テストできる。
 */
export function buildScheduleProperties(
  input: BuildSchedulePropertiesInput,
): Record<string, unknown> {
  const properties: Record<string, unknown> = {
    [SCHEDULE_DB_PROPERTY_NAMES.title]: { title: [{ text: { content: input.title } }] },
    [SCHEDULE_DB_PROPERTY_NAMES.date]: { date: { start: input.dateISO } },
  };

  if (input.url) {
    properties[SCHEDULE_DB_PROPERTY_NAMES.url] = { url: input.url };
  }

  if (input.fileUploads.length > 0) {
    properties[SCHEDULE_DB_PROPERTY_NAMES.photos] = {
      files: input.fileUploads.map((f) => ({
        type: "file_upload",
        file_upload: { id: f.id },
        name: f.name,
      })),
    };
  }

  return properties;
}
