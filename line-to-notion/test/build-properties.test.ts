import { test } from "node:test";
import assert from "node:assert/strict";
import {
  buildCommentProperties,
  buildScheduleProperties,
  COMMENTS_DB_PROPERTY_NAMES,
  SCHEDULE_DB_PROPERTY_NAMES,
} from "../lib/build-properties.js";

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

test("予定: タイトル列(旅行名)は常に空、スポット名はrich_textで入る", () => {
  const properties = buildScheduleProperties({
    title: "焼肉屋さん",
    dateISO: "2025-04-29T11:26:00",
    hasTime: true,
    fileUploads: [],
  });

  assert.deepEqual(properties[SCHEDULE_DB_PROPERTY_NAMES.dbTitle], { title: [] });
  assert.deepEqual(properties[SCHEDULE_DB_PROPERTY_NAMES.title], {
    rich_text: [{ text: { content: "焼肉屋さん" } }],
  });
  assert.deepEqual(properties[SCHEDULE_DB_PROPERTY_NAMES.date], {
    date: { start: "2025-04-29T11:26:00" },
  });
});

test("予定: URLがある場合はurlプロパティが入り、無い場合は含まれない", () => {
  const withUrl = buildScheduleProperties({
    title: "焼肉屋さん",
    dateISO: "2025-04-29",
    hasTime: false,
    url: "https://tabelog.com/example",
    fileUploads: [],
  });
  assert.deepEqual(withUrl[SCHEDULE_DB_PROPERTY_NAMES.url], { url: "https://tabelog.com/example" });

  const withoutUrl = buildScheduleProperties({
    title: "焼肉屋さん",
    dateISO: "2025-04-29",
    hasTime: false,
    fileUploads: [],
  });
  assert.equal(SCHEDULE_DB_PROPERTY_NAMES.url in withoutUrl, false);
});

test("予定: 画像がある場合、写真プロパティにfile_upload参照が入る", () => {
  const properties = buildScheduleProperties({
    title: "焼肉屋さん",
    dateISO: "2025-04-29",
    hasTime: false,
    fileUploads: [{ id: "upload-1", name: "line-1.jpg" }],
  });

  assert.deepEqual(properties[SCHEDULE_DB_PROPERTY_NAMES.photos], {
    files: [{ type: "file_upload", file_upload: { id: "upload-1" }, name: "line-1.jpg" }],
  });
});
