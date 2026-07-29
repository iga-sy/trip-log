import { test } from "node:test";
import assert from "node:assert/strict";
import { parseTripNames } from "../lib/env.js";

test("カンマ区切りの旅行名を配列にパースする", () => {
  assert.deepEqual(parseTripNames("那須旅行2024,京都旅行2025"), [
    "那須旅行2024",
    "京都旅行2025",
  ]);
});

test("前後の空白を除去する", () => {
  assert.deepEqual(parseTripNames(" 那須旅行2024 , 京都旅行2025 "), [
    "那須旅行2024",
    "京都旅行2025",
  ]);
});

test("単一の旅行名でも配列になる", () => {
  assert.deepEqual(parseTripNames("那須旅行2024"), ["那須旅行2024"]);
});

test("空要素は除外される", () => {
  assert.deepEqual(parseTripNames("那須旅行2024,,京都旅行2025,"), [
    "那須旅行2024",
    "京都旅行2025",
  ]);
});
