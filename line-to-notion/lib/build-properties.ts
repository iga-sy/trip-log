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
