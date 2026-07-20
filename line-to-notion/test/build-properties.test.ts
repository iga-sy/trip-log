import { test } from "node:test";
import assert from "node:assert/strict";
import { buildCommentProperties, COMMENTS_DB_PROPERTY_NAMES } from "../lib/build-properties.js";

test("テキストのみの場合、投稿者とコメントのみのプロパティが返る", () => {
  const properties = buildCommentProperties({
    authorName: "修",
    text: "楽しかった!",
    fileUploads: [],
  });

  assert.deepEqual(properties[COMMENTS_DB_PROPERTY_NAMES.author], { select: { name: "修" } });
  assert.deepEqual(properties[COMMENTS_DB_PROPERTY_NAMES.text], {
    rich_text: [{ text: { content: "楽しかった!" } }],
  });
  assert.equal(COMMENTS_DB_PROPERTY_NAMES.photos in properties, false);
});

test("画像のみの場合、写真プロパティにfile_upload参照が入る", () => {
  const properties = buildCommentProperties({
    authorName: "美",
    text: "",
    fileUploads: [
      { id: "upload-1", name: "line-1.jpg" },
      { id: "upload-2", name: "line-2.jpg" },
    ],
  });

  assert.deepEqual(properties[COMMENTS_DB_PROPERTY_NAMES.text], { rich_text: [] });
  assert.deepEqual(properties[COMMENTS_DB_PROPERTY_NAMES.photos], {
    files: [
      { type: "file_upload", file_upload: { id: "upload-1" }, name: "line-1.jpg" },
      { type: "file_upload", file_upload: { id: "upload-2" }, name: "line-2.jpg" },
    ],
  });
});

test("テキストと画像の両方がある場合、両方のプロパティが含まれる", () => {
  const properties = buildCommentProperties({
    authorName: "悠",
    text: "この写真見て",
    fileUploads: [{ id: "upload-1", name: "line-1.jpg" }],
  });

  assert.deepEqual(properties[COMMENTS_DB_PROPERTY_NAMES.text], {
    rich_text: [{ text: { content: "この写真見て" } }],
  });
  assert.deepEqual(properties[COMMENTS_DB_PROPERTY_NAMES.photos], {
    files: [{ type: "file_upload", file_upload: { id: "upload-1" }, name: "line-1.jpg" }],
  });
});

test("displayName取得に失敗しフォールバック文字列でも通常どおり組み立てられる", () => {
  const properties = buildCommentProperties({
    authorName: "(不明)",
    text: "テスト",
    fileUploads: [],
  });

  assert.deepEqual(properties[COMMENTS_DB_PROPERTY_NAMES.author], { select: { name: "(不明)" } });
});
