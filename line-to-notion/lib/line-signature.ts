import { createHmac, timingSafeEqual } from "node:crypto";

export function verifyLineSignature(
  rawBody: string,
  signature: string | null,
  channelSecret: string,
): boolean {
  if (!signature) {
    return false;
  }

  const expected = createHmac("sha256", channelSecret)
    .update(rawBody, "utf8")
    .digest("base64");

  const expectedBuf = Buffer.from(expected, "utf8");
  const actualBuf = Buffer.from(signature, "utf8");

  if (expectedBuf.length !== actualBuf.length) {
    return false;
  }

  return timingSafeEqual(expectedBuf, actualBuf);
}
