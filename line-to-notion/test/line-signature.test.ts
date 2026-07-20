import { test } from "node:test";
import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import { verifyLineSignature } from "../lib/line-signature.js";

const CHANNEL_SECRET = "test-channel-secret";
const RAW_BODY = JSON.stringify({ destination: "xxx", events: [] });

function sign(body: string, secret: string): string {
  return createHmac("sha256", secret).update(body, "utf8").digest("base64");
}

test("正しい署名は検証を通過する", () => {
  const signature = sign(RAW_BODY, CHANNEL_SECRET);
  assert.equal(verifyLineSignature(RAW_BODY, signature, CHANNEL_SECRET), true);
});

test("ボディが改ざんされていると検証に失敗する", () => {
  const signature = sign(RAW_BODY, CHANNEL_SECRET);
  const tamperedBody = JSON.stringify({ destination: "yyy", events: [] });
  assert.equal(verifyLineSignature(tamperedBody, signature, CHANNEL_SECRET), false);
});

test("署名ヘッダーが無いと検証に失敗する", () => {
  assert.equal(verifyLineSignature(RAW_BODY, null, CHANNEL_SECRET), false);
});

test("異なるシークレットで計算された署名は検証に失敗する", () => {
  const signature = sign(RAW_BODY, "other-secret");
  assert.equal(verifyLineSignature(RAW_BODY, signature, CHANNEL_SECRET), false);
});
