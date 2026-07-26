import { requireEnv } from "../lib/env.js";
import { verifyLineSignature } from "../lib/line-signature.js";
import {
  fetchImageContent,
  isImageMessage,
  isMessageEvent,
  isTextMessage,
  isUserSource,
  type LineMessageEvent,
  type LineWebhookBody,
} from "../lib/line-api.js";
import { uploadFileToNotion, createPage, type NotionFileUpload } from "../lib/notion-write.js";
import { buildCommentProperties, buildScheduleProperties } from "../lib/build-properties.js";
import { parseScheduleMessage } from "../lib/parse-schedule.js";
import { parseNamePrefix } from "../lib/parse-name-prefix.js";

export async function POST(request: Request): Promise<Response> {
  const lineChannelSecret = requireEnv("LINE_CHANNEL_SECRET");
  const lineChannelAccessToken = requireEnv("LINE_CHANNEL_ACCESS_TOKEN");
  const notionApiKey = requireEnv("NOTION_API_KEY");
  const notionCommentsDatabaseId = requireEnv("NOTION_COMMENTS_DATABASE_ID");
  const notionScheduleDatabaseId = requireEnv("NOTION_DATABASE_ID");

  const rawBody = await request.text();
  const signature = request.headers.get("x-line-signature");

  if (!verifyLineSignature(rawBody, signature, lineChannelSecret)) {
    console.error("LINE署名検証に失敗しました");
    return new Response(null, { status: 401, headers: { "X-Debug-Deploy": "2026-07-26-c5cbaeb" } });
  }

  let body: LineWebhookBody;
  try {
    body = JSON.parse(rawBody) as LineWebhookBody;
  } catch {
    return new Response(null, { status: 400 });
  }

  const byUser = new Map<string, LineMessageEvent[]>();
  for (const event of body.events ?? []) {
    if (!isMessageEvent(event)) continue;
    if (!isUserSource(event.source)) continue;
    if (!isTextMessage(event.message) && !isImageMessage(event.message)) continue;

    const arr = byUser.get(event.source.userId) ?? [];
    arr.push(event);
    byUser.set(event.source.userId, arr);
  }

  for (const [userId, events] of byUser) {
    try {
      await processUserEvents(userId, events, {
        lineChannelAccessToken,
        notionApiKey,
        notionCommentsDatabaseId,
        notionScheduleDatabaseId,
      });
    } catch (err) {
      console.error(`ユーザー ${userId} のイベント処理に失敗しました:`, err);
    }
  }

  return new Response(null, { status: 200 });
}

interface ProcessContext {
  lineChannelAccessToken: string;
  notionApiKey: string;
  notionCommentsDatabaseId: string;
  notionScheduleDatabaseId: string;
}

async function processUserEvents(
  userId: string,
  events: LineMessageEvent[],
  ctx: ProcessContext,
): Promise<void> {
  const textEvent = events.find((e) => isTextMessage(e.message));
  const text =
    textEvent && isTextMessage(textEvent.message) ? textEvent.message.text : "";

  const imageEvents = events.filter((e) => isImageMessage(e.message));
  const fileUploads: NotionFileUpload[] = [];
  for (const [index, imageEvent] of imageEvents.entries()) {
    if (!isImageMessage(imageEvent.message)) continue;
    const content = await fetchImageContent(imageEvent.message.id, ctx.lineChannelAccessToken);
    const ext = content.contentType.split("/")[1] ?? "jpg";
    const filename = `line-${imageEvent.message.id}-${index}.${ext}`;
    const uploaded = await uploadFileToNotion(
      ctx.notionApiKey,
      content.buffer,
      content.contentType,
      filename,
    );
    fileUploads.push(uploaded);
  }

  if (!text && fileUploads.length === 0) {
    return;
  }

  // 1行目が「予定」の決まったフォーマットならタイトル・日時・リンクを抽出して
  // 「予定」DBに書き込む。判定・抽出はAI等を使わない文字列処理のみで完結する。
  const schedule = text ? parseScheduleMessage(text) : null;

  if (schedule) {
    const properties = buildScheduleProperties({ ...schedule, fileUploads });
    await createPage(ctx.notionApiKey, ctx.notionScheduleDatabaseId, properties);
    return;
  }

  // 「予定」でなければ、本文先頭の名前プレフィックス（例:「修: 」）を判定して
  // 「全体感想」DBに書き込む。プレフィックスが無ければ投稿者未設定のまま記録する。
  const { name, text: commentText } = parseNamePrefix(text);
  const properties = buildCommentProperties({ name, text: commentText, fileUploads });
  await createPage(ctx.notionApiKey, ctx.notionCommentsDatabaseId, properties);
}
