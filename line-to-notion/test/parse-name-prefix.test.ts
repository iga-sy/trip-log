import { test } from "node:test";
import assert from "node:assert/strict";
import { parseNamePrefix } from "../lib/parse-name-prefix.js";

test("半角コロンの名前プレフィックスを検出する", () => {
  assert.deepEqual(parseNamePrefix("修: 楽しかった"), { name: "修", text: "楽しかった" });
});

test("全角コロンの名前プレフィックスを検出する", () => {
  assert.deepEqual(parseNamePrefix("美：美味しかった"), { name: "美", text: "美味しかった" });
});

test("プレフィックス直後の空白は除去される", () => {
  assert.deepEqual(parseNamePrefix("紗:   楽しかった"), { name: "紗", text: "楽しかった" });
});

test("4人分の名前すべてを検出できる", () => {
  assert.equal(parseNamePrefix("修:a").name, "修");
  assert.equal(parseNamePrefix("美:a").name, "美");
  assert.equal(parseNamePrefix("悠:a").name, "悠");
  assert.equal(parseNamePrefix("紗:a").name, "紗");
});

test("名前プレフィックスが無ければnameはnullで本文はそのまま", () => {
  assert.deepEqual(parseNamePrefix("今日は楽しかった"), {
    name: null,
    text: "今日は楽しかった",
  });
});

test("文中に名前が出てきても先頭でなければ検出しない", () => {
  const result = parseNamePrefix("今日は修と一緒に行った");
  assert.equal(result.name, null);
  assert.equal(result.text, "今日は修と一緒に行った");
});
