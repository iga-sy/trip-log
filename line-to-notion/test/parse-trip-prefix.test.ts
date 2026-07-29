import { test } from "node:test";
import assert from "node:assert/strict";
import { parseTripPrefix } from "../lib/parse-trip-prefix.js";

test("`[旅行名]`プレフィックスを検出する", () => {
  assert.deepEqual(parseTripPrefix("[那須旅行2024] 修: 楽しかった"), {
    tripName: "那須旅行2024",
    text: "修: 楽しかった",
  });
});

test("プレフィックス直後の空白は除去される", () => {
  assert.deepEqual(parseTripPrefix("[京都旅行2025]   楽しかった"), {
    tripName: "京都旅行2025",
    text: "楽しかった",
  });
});

test("プレフィックスが無ければtripNameはnullで本文はそのまま", () => {
  assert.deepEqual(parseTripPrefix("修: 楽しかった"), {
    tripName: null,
    text: "修: 楽しかった",
  });
});

test("複数行メッセージの先頭行にあっても検出できる", () => {
  const result = parseTripPrefix("[那須旅行2024]\n修: 楽しかった");
  assert.equal(result.tripName, "那須旅行2024");
  assert.equal(result.text, "修: 楽しかった");
});

test("文中に`[...]`が出てきても先頭でなければ検出しない", () => {
  const result = parseTripPrefix("今日は[那須]どうぶつ王国に行った");
  assert.equal(result.tripName, null);
  assert.equal(result.text, "今日は[那須]どうぶつ王国に行った");
});
