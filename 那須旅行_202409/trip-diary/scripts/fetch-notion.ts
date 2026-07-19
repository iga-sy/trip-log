import { fileURLToPath } from "node:url";
import path from "node:path";
import fs from "node:fs/promises";
import * as dotenv from "dotenv";
import { Client, isFullPage } from "@notionhq/client";
import type { PageObjectResponse } from "@notionhq/client/build/src/api-endpoints";
import { toVideoEmbed } from "./lib/video-embed.ts";
import { toMapEmbed } from "./lib/map-embed.ts";
import type { TripData, TripEvent } from "../src/types/trip.ts";

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Notion側のプロパティ名が変わった場合はここだけ直せばよい
const PROPERTY_NAMES = {
  title: "タイトル",
  date: "日時",
  memo: "メモ",
  map: "場所 / マップ",
  photos: "写真",
  video: "動画URL",
} as const;

const OUTPUT_DIR_IMAGES = path.resolve(__dirname, "../public/images");
const OUTPUT_DATA_FILE = path.resolve(__dirname, "../src/data/trip-data.json");

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    console.error(
      `環境変数 ${name} が設定されていません。.env または GitHub Actions Secrets を確認してください。`,
    );
    process.exit(1);
  }
  return value;
}

async function queryAllPages(notion: Client, databaseId: string): Promise<PageObjectResponse[]> {
  const pages: PageObjectResponse[] = [];
  let cursor: string | undefined;

  do {
    const response = await notion.databases.query({
      database_id: databaseId,
      sorts: [{ property: PROPERTY_NAMES.date, direction: "ascending" }],
      start_cursor: cursor,
    });
    for (const result of response.results) {
      if (isFullPage(result)) {
        pages.push(result);
      }
    }
    cursor = response.has_more ? (response.next_cursor ?? undefined) : undefined;
  } while (cursor);

  return pages;
}

async function fetchDatabaseTitle(notion: Client, databaseId: string): Promise<string> {
  const db = await notion.databases.retrieve({ database_id: databaseId });
  if ("title" in db) {
    const text = db.title.map((t) => t.plain_text).join("");
    return text || "旅行のしおり";
  }
  return "旅行のしおり";
}

function getPlainText(richText: { plain_text: string }[]): string {
  return richText.map((t) => t.plain_text).join("");
}

function extractTitle(page: PageObjectResponse): string {
  const prop = page.properties[PROPERTY_NAMES.title];
  if (prop?.type === "title") {
    return getPlainText(prop.title) || "(無題)";
  }
  return "(無題)";
}

function extractDate(page: PageObjectResponse): { dateISO: string; hasTime: boolean } {
  const prop = page.properties[PROPERTY_NAMES.date];
  if (prop?.type === "date" && prop.date?.start) {
    return { dateISO: prop.date.start, hasTime: prop.date.start.includes("T") };
  }
  return { dateISO: "", hasTime: false };
}

function extractMemo(page: PageObjectResponse): string {
  const prop = page.properties[PROPERTY_NAMES.memo];
  if (prop?.type === "rich_text") {
    return getPlainText(prop.rich_text);
  }
  return "";
}

function extractUrl(page: PageObjectResponse, propertyName: string): string | undefined {
  const prop = page.properties[propertyName];
  if (prop?.type === "url" && prop.url) {
    return prop.url;
  }
  return undefined;
}

interface NotionFileEntry {
  name: string;
  url: string;
}

function extractFileEntries(page: PageObjectResponse): NotionFileEntry[] {
  const prop = page.properties[PROPERTY_NAMES.photos];
  if (prop?.type !== "files") {
    return [];
  }
  const entries: NotionFileEntry[] = [];
  for (const file of prop.files) {
    if (file.type === "file") {
      entries.push({ name: file.name, url: file.file.url });
    } else if (file.type === "external") {
      entries.push({ name: file.name, url: file.external.url });
    }
  }
  return entries;
}

function guessExtension(url: string, fallbackName: string): string {
  try {
    const ext = path.extname(new URL(url).pathname);
    if (ext) return ext;
  } catch {
    // noop: フォールバックへ
  }
  return path.extname(fallbackName) || ".jpg";
}

async function downloadImage(url: string, destPath: string): Promise<boolean> {
  try {
    const res = await fetch(url);
    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`);
    }
    const buffer = Buffer.from(await res.arrayBuffer());
    await fs.writeFile(destPath, buffer);
    return true;
  } catch (err) {
    console.warn(`[fetch-notion] 画像ダウンロード失敗: ${url} (${String(err)})`);
    return false;
  }
}

async function downloadPhotos(pageId: string, entries: NotionFileEntry[]): Promise<string[]> {
  const photoPaths: string[] = [];
  for (const entry of entries) {
    const ext = guessExtension(entry.url, entry.name);
    const filename = `${pageId}-${photoPaths.length}${ext}`;
    const ok = await downloadImage(entry.url, path.join(OUTPUT_DIR_IMAGES, filename));
    if (ok) {
      photoPaths.push(`images/${filename}`);
    }
  }
  return photoPaths;
}

async function main() {
  const apiKey = requireEnv("NOTION_API_KEY");
  const databaseId = requireEnv("NOTION_DATABASE_ID");
  const notion = new Client({ auth: apiKey });

  await fs.mkdir(OUTPUT_DIR_IMAGES, { recursive: true });
  await fs.mkdir(path.dirname(OUTPUT_DATA_FILE), { recursive: true });

  console.log("[fetch-notion] Notionデータベースを取得中...");
  const [tripTitle, pages] = await Promise.all([
    fetchDatabaseTitle(notion, databaseId),
    queryAllPages(notion, databaseId),
  ]);
  console.log(`[fetch-notion] ${pages.length} 件のページを取得しました`);

  const events: TripEvent[] = [];
  let warningCount = 0;

  for (const page of pages) {
    const title = extractTitle(page);
    const { dateISO, hasTime } = extractDate(page);
    if (!dateISO) {
      console.warn(`[fetch-notion] 日時未設定のためスキップ: ${title}`);
      warningCount += 1;
      continue;
    }

    const memo = extractMemo(page);
    const mapUrl = extractUrl(page, PROPERTY_NAMES.map);
    const videoUrl = extractUrl(page, PROPERTY_NAMES.video);

    const fileEntries = extractFileEntries(page);
    const photos = await downloadPhotos(page.id, fileEntries);
    if (photos.length < fileEntries.length) {
      warningCount += 1;
    }

    const mapEmbedUrl = await toMapEmbed(mapUrl);
    const { embedUrl: videoEmbedUrl, type: videoEmbedType } = toVideoEmbed(videoUrl);

    events.push({
      id: page.id,
      title,
      dateISO,
      hasTime,
      memo,
      mapUrl,
      mapEmbedUrl,
      photos,
      videoUrl,
      videoEmbedUrl,
      videoEmbedType,
    });
  }

  events.sort((a, b) => a.dateISO.localeCompare(b.dateISO));

  const heroEvent = events.find((event) => event.photos.length > 0);

  const tripData: TripData = {
    tripTitle,
    heroImage: heroEvent ? heroEvent.photos[0] : null,
    generatedAt: new Date().toISOString(),
    events,
  };

  await fs.writeFile(OUTPUT_DATA_FILE, JSON.stringify(tripData, null, 2), "utf-8");

  console.log(`[fetch-notion] 完了: イベント${events.length}件、警告${warningCount}件`);
  console.log(`[fetch-notion] 出力先: ${OUTPUT_DATA_FILE}`);
}

main().catch((err) => {
  console.error("[fetch-notion] 致命的エラー:", err);
  process.exit(1);
});
