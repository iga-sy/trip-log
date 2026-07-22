import type { NotionFileUpload } from "./notion-write.js";

export const COMMENTS_DB_PROPERTY_NAMES = {
  author: "投稿者",
  text: "コメント",
  photos: "写真",
} as const;

export interface BuildCommentPropertiesInput {
  authorName: string;
  text: string;
  fileUploads: NotionFileUpload[];
}

/**
 * LINEから受け取った投稿者名・本文・アップロード済み画像を、
 * Notion pages.create の properties オブジェクトに変換する純粋関数。
 * 外部通信を行わないため、モック無しで単体テストできる。
 */
export function buildCommentProperties(
  input: BuildCommentPropertiesInput,
): Record<string, unknown> {
  const properties: Record<string, unknown> = {
    [COMMENTS_DB_PROPERTY_NAMES.author]: { select: { name: input.authorName } },
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
