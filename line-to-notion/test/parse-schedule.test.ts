import { test } from "node:test";
import assert from "node:assert/strict";
import { parseScheduleMessage, parsePlainDate } from "../lib/parse-schedule.js";

test("時刻ありの正しいフォーマットを抽出できる", () => {
  const result = parseScheduleMessage(
    "予定\nタイトル: 那須どうぶつ王国\n日時: 2024-09-15 09:30\nリンク: https://example.com",
  );
  assert.deepEqual(result, {
    title: "那須どうぶつ王国",
    dateISO: "2024-09-15T09:30:00+09:00",
    hasTime: true,
    url: "https://example.com",
    tripName: undefined,
  });
});

test("時刻なし(日付のみ)の正しいフォーマットを抽出できる", () => {
  const result = parseScheduleMessage("予定\nタイトル: 那須どうぶつ王国\n日時: 2024-09-15");
  assert.deepEqual(result, {
    title: "那須どうぶつ王国",
    dateISO: "2024-09-15",
    hasTime: false,
    url: undefined,
    tripName: undefined,
  });
});

test("リンクが無くてもタイトル・日時があれば抽出できる", () => {
  const result = parseScheduleMessage("予定\nタイトル: 那須どうぶつ王国\n日時: 2024-09-15");
  assert.equal(result?.url, undefined);
});

test("ラベルの順序が入れ替わっていても正しくパースできる", () => {
  const result = parseScheduleMessage(
    "予定\n日時: 2024-09-15 09:30\nリンク: https://example.com\nタイトル: 那須どうぶつ王国",
  );
  assert.deepEqual(result, {
    title: "那須どうぶつ王国",
    dateISO: "2024-09-15T09:30:00+09:00",
    hasTime: true,
    url: "https://example.com",
    tripName: undefined,
  });
});

test("「旅行:」ラベルがあれば旅行名を抽出できる", () => {
  const result = parseScheduleMessage(
    "予定\n旅行: 京都旅行2025\nタイトル: 清水寺\n日時: 2025-05-01",
  );
  assert.equal(result?.tripName, "京都旅行2025");
});

test("「旅行:」ラベルが無ければtripNameはundefined", () => {
  const result = parseScheduleMessage("予定\nタイトル: 那須どうぶつ王国\n日時: 2024-09-15");
  assert.equal(result?.tripName, undefined);
});

test("全角コロンのラベルも受け付ける", () => {
  const result = parseScheduleMessage("予定\nタイトル：那須どうぶつ王国\n日時：2024-09-15");
  assert.equal(result?.title, "那須どうぶつ王国");
  assert.equal(result?.dateISO, "2024-09-15");
});

test("1行目が「予定」でなければnullを返す(感想として扱われる)", () => {
  const result = parseScheduleMessage("今日の那須どうぶつ王国楽しかった！");
  assert.equal(result, null);
});

test("「予定」だがタイトルが欠落していればnullを返す", () => {
  const result = parseScheduleMessage("予定\n日時: 2024-09-15 09:30");
  assert.equal(result, null);
});

test("「予定」だが日時が欠落していればnullを返す", () => {
  const result = parseScheduleMessage("予定\nタイトル: 那須どうぶつ王国");
  assert.equal(result, null);
});

test("日時が不正な形式であればnullを返す", () => {
  const result = parseScheduleMessage("予定\nタイトル: 那須どうぶつ王国\n日時: 明日の15時");
  assert.equal(result, null);
});

test("存在しない日付であればnullを返す", () => {
  const result = parseScheduleMessage("予定\nタイトル: 那須どうぶつ王国\n日時: 2024-13-45");
  assert.equal(result, null);
});

test("parsePlainDate: 時刻ありを正しくISO化する", () => {
  assert.deepEqual(parsePlainDate("2024-09-15 09:30"), {
    dateISO: "2024-09-15T09:30:00+09:00",
    hasTime: true,
  });
});

test("parsePlainDate: 日付のみを正しく扱う", () => {
  assert.deepEqual(parsePlainDate("2024-09-15"), { dateISO: "2024-09-15", hasTime: false });
});

test("parsePlainDate: 不正な時刻(25時)はnull", () => {
  assert.equal(parsePlainDate("2024-09-15 25:00"), null);
});

test("parsePlainDate: 存在しない日(2月30日)はnull", () => {
  assert.equal(parsePlainDate("2024-02-30"), null);
});

test("スラッシュ区切り・1桁月日の日時も抽出できる", () => {
  const result = parseScheduleMessage("予定\nタイトル：Pino cafe&meal\n日時：2025/4/29 11:26");
  assert.equal(result?.title, "Pino cafe&meal");
  assert.equal(result?.dateISO, "2025-04-29T11:26:00+09:00");
  assert.equal(result?.hasTime, true);
});

test("parsePlainDate: スラッシュ区切りの日付のみも扱える", () => {
  assert.deepEqual(parsePlainDate("2025/4/29"), { dateISO: "2025-04-29", hasTime: false });
});

test("「リンク」ラベルの後に店名があっても、本文中のURLを自動検出する", () => {
  const result = parseScheduleMessage(
    [
      "予定",
      "タイトル：Pino cafe&meal",
      "日時：2025/4/29 11:26",
      "リンク：ピノ カフェ&ミール",
      "0287-74-5726",
      "栃木県那須郡那須町高久甲5109-10 ",
      "https://tabelog.com/tochigi/A0905/A090501/9017730/",
    ].join("\n"),
  );
  assert.equal(result?.url, "https://tabelog.com/tochigi/A0905/A090501/9017730/");
});

test("URLがどの行にあっても（ラベル無しでも）検出できる", () => {
  const result = parseScheduleMessage(
    "予定\nタイトル: 那須どうぶつ王国\n日時: 2024-09-15\nhttps://example.com/spot",
  );
  assert.equal(result?.url, "https://example.com/spot");
});
