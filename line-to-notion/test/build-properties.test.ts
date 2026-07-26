import { test } from "node:test";
import assert from "node:assert/strict";
import { buildCommentProperties, COMMENTS_DB_PROPERTY_NAMES } from "../lib/build-properties.js";

test("タイトル列は常に空で作成される", () => {
  const properties = buildCommentProperties({ name: "修", text: "楽しかった!", fileUploads: [] });
  assert.deepEqual(properties[COMMENTS_DB_PROPERTY_NAMES.title], { title: [] });
});

test("名前プレフィックスがある場合、マルチセレクトとメモが正しく入る", () => {
  const properties = buildCommentProperties({
    name: "修",
    text: "楽しかった!",
    fileUploads: [],
  });

  assert.deepEqual(properties[COMMENTS_DB_PROPERTY_NAMES.author], {
    multi_select: [{ name: "修" }],
  });
  assert.deepEqual(properties[COMMENTS_DB_PROPERTY_NAMES.text], {
    rich_text: [{ text: { content: "楽しかった!" } }],
  });
  assert.equal(COMMENTS_DB_PROPERTY_NAMES.photos in properties, false);
});

test("名前が判定できない場合、マルチセレクトは空配列になる", () => {
  const properties = buildCommentProperties({
    name: null,
    text: "今日は楽しかった",
    fileUploads: [],
  });

  assert.deepEqual(properties[COMMENTS_DB_PROPERTY_NAMES.author], { multi_select: [] });
});

test("画像のみの場合、写真プロパティにfile_upload参照が入る", () => {
  const properties = buildCommentProperties({
    name: "美",
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
    name: "悠",
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
