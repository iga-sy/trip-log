export interface LineTextMessage {
  type: "text";
  id: string;
  text: string;
}

export interface LineImageMessage {
  type: "image";
  id: string;
}

export type LineMessage = LineTextMessage | LineImageMessage | { type: string; id: string };

export interface LineUserSource {
  type: "user";
  userId: string;
}

export type LineSource = LineUserSource | { type: "group" | "room"; userId?: string };

export interface LineMessageEvent {
  type: "message";
  message: LineMessage;
  source: LineSource;
  timestamp: number;
  replyToken?: string;
}

export type LineEvent = LineMessageEvent | { type: string; source: LineSource };

export interface LineWebhookBody {
  destination: string;
  events: LineEvent[];
}

export function isMessageEvent(event: LineEvent): event is LineMessageEvent {
  return event.type === "message";
}

export function isUserSource(source: LineSource): source is LineUserSource {
  return source.type === "user";
}

export function isTextMessage(message: LineMessage): message is LineTextMessage {
  return message.type === "text";
}

export function isImageMessage(message: LineMessage): message is LineImageMessage {
  return message.type === "image";
}

const FALLBACK_DISPLAY_NAME = "(不明)";

export async function fetchDisplayName(
  userId: string,
  channelAccessToken: string,
): Promise<string> {
  try {
    const res = await fetch(`https://api.line.me/v2/bot/profile/${userId}`, {
      headers: { Authorization: `Bearer ${channelAccessToken}` },
    });
    if (!res.ok) {
      console.error(`LINE profile取得失敗: status=${res.status} userId=${userId}`);
      return FALLBACK_DISPLAY_NAME;
    }
    const data = (await res.json()) as { displayName?: string };
    return data.displayName ?? FALLBACK_DISPLAY_NAME;
  } catch (err) {
    console.error("LINE profile取得エラー:", err);
    return FALLBACK_DISPLAY_NAME;
  }
}

export interface LineImageContent {
  buffer: Buffer;
  contentType: string;
}

export async function fetchImageContent(
  messageId: string,
  channelAccessToken: string,
): Promise<LineImageContent> {
  const res = await fetch(`https://api-data.line.me/v2/bot/message/${messageId}/content`, {
    headers: { Authorization: `Bearer ${channelAccessToken}` },
  });
  if (!res.ok) {
    throw new Error(`LINE画像取得失敗: status=${res.status} messageId=${messageId}`);
  }
  const contentType = res.headers.get("content-type") ?? "application/octet-stream";
  const arrayBuffer = await res.arrayBuffer();
  return { buffer: Buffer.from(arrayBuffer), contentType };
}
