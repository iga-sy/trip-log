import { fileURLToPath } from "node:url";
import path from "node:path";
import fs from "node:fs/promises";
import * as dotenv from "dotenv";
import CryptoJS from "crypto-js";
import { Client, isFullPage } from "@notionhq/client";
import type { PageObjectResponse } from "@notionhq/client/build/src/api-endpoints";
import { geocode } from "./lib/geocode.ts";
import type { TripComment, TripData, TripEvent } from "../src/types/trip.ts";

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Notion側のプロパティ名が変わった場合はここだけ直せばよい
const PROPERTY_NAMES = {
  title: "タイトル",
  date: "日時",
  memo: "メモ",
  shopLink: "お店リンク",
  photos: "写真",
} as const;

// 「全体の感想」データベースのプロパティ名
const COMMENTS_DB_PROPERTY_NAMES = {
  author: "投稿者",
  text: "コメント",
  photos: "写真",
} as const;

const FAMILY_MEMBERS = ["修", "美", "悠", "紗"] as const;

const OUTPUT_DIR_IMAGES = path.resolve(__dirname, "../public/images");
const OUTPUT_DATA_FILE = path.resolve(__dirname, "../public/data.json");

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

async function queryAllPages(
  notion: Client,
  databaseId: string,
  sorts: Parameters<Client["databases"]["query"]>[0]["sorts"],
): Promise<PageObjectResponse[]> {
  const pages: PageObjectResponse[] = [];
  let cursor: string | undefined;

  do {
    const response = await notion.databases.query({
      database_id: databaseId,
      sorts,
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

function extractComments(page: PageObjectResponse): TripComment[] {
  const comments: TripComment[] = [];
  for (const name of FAMILY_MEMBERS) {
    const prop = page.properties[`コメント(${name})`];
    if (prop?.type === "rich_text") {
      const text = getPlainText(prop.rich_text).trim();
      if (text) {
        comments.push({ name, text, photos: [] });
      }
    }
  }
  return comments;
}

interface NotionFileEntry {
  name: string;
  url: string;
}

function extractFileEntries(page: PageObjectResponse, propertyName: string): NotionFileEntry[] {
  const prop = page.properties[propertyName];
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

async function downloadPhotos(
  idPrefix: string,
  entries: NotionFileEntry[],
): Promise<string[]> {
  const photoPaths: string[] = [];
  for (const entry of entries) {
    const ext = guessExtension(entry.url, entry.name);
    const filename = `${idPrefix}-${photoPaths.length}${ext}`;
    const ok = await downloadImage(entry.url, path.join(OUTPUT_DIR_IMAGES, filename));
    if (ok) {
      photoPaths.push(`images/${filename}`);
    }
  }
  return photoPaths;
}

async function fetchOverallComments(notion: Client, commentsDatabaseId: string): Promise<TripComment[]> {
  const pages = await queryAllPages(notion, commentsDatabaseId, [
    { timestamp: "created_time", direction: "ascending" },
  ]);

  const comments: TripComment[] = [];
  for (const page of pages) {
    const authorProp = page.properties[COMMENTS_DB_PROPERTY_NAMES.author];
    const textProp = page.properties[COMMENTS_DB_PROPERTY_NAMES.text];

    const name = authorProp?.type === "select" ? authorProp.select?.name : undefined;
    const text = textProp?.type === "rich_text" ? getPlainText(textProp.rich_text).trim() : "";

    const fileEntries = extractFileEntries(page, COMMENTS_DB_PROPERTY_NAMES.photos);
    const photos = await downloadPhotos(`comment-${page.id}`, fileEntries);

    if (!name || (!text && photos.length === 0)) {
      console.warn(`[fetch-notion] 全体感想: 投稿者、または本文・写真の両方が空のためスキップ (page: ${page.id})`);
      continue;
    }
    comments.push({ name, text, photos });
  }
  return comments;
}

async function main() {
  const apiKey = requireEnv("NOTION_API_KEY");
  const databaseId = requireEnv("NOTION_DATABASE_ID");
  const commentsDatabaseId = requireEnv("NOTION_COMMENTS_DATABASE_ID");
  const sitePassword = requireEnv("SITE_PASSWORD");
  const notion = new Client({ auth: apiKey });

  await fs.mkdir(OUTPUT_DIR_IMAGES, { recursive: true });
  await fs.mkdir(path.dirname(OUTPUT_DATA_FILE), { recursive: true });

  console.log("[fetch-notion] Notionデータベースを取得中...");
  const [tripTitle, pages, overallComments] = await Promise.all([
    fetchDatabaseTitle(notion, databaseId),
    queryAllPages(notion, databaseId, [{ property: PROPERTY_NAMES.date, direction: "ascending" }]),
    fetchOverallComments(notion, commentsDatabaseId),
  ]);
  console.log(`[fetch-notion] ${pages.length} 件のページ、${overallComments.length} 件の全体感想を取得しました`);

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
    const shopUrl = extractUrl(page, PROPERTY_NAMES.shopLink);
    const comments = extractComments(page);

    const fileEntries = extractFileEntries(page, PROPERTY_NAMES.photos);
    const photos = await downloadPhotos(page.id, fileEntries);
    if (photos.length < fileEntries.length) {
      warningCount += 1;
    }

    // 地図のピンはお店の名前(タイトル)をそのままジオコーディングして求める。
    // 専用のURLプロパティは不要な代わり、同名の別の場所がある場合は誤爆する可能性がある。
    const coords = await geocode(title);

    events.push({
      id: page.id,
      title,
      dateISO,
      hasTime,
      memo,
      shopUrl,
      comments,
      photos,
      coords,
    });
  }

  events.sort((a, b) => a.dateISO.localeCompare(b.dateISO));

  const heroEvent = events.find((event) => event.photos.length > 0);

  const tripData: TripData = {
    tripTitle,
    heroImage: heroEvent ? heroEvent.photos[0] : null,
    generatedAt: new Date().toISOString(),
    events,
    overallComments,
  };

  // dataは暗号化してからpublic/配下に書き出す。復号鍵(SITE_PASSWORD)はビルドログにも
  // 出力に含めない。平文JSONはディスクにも残さずメモリ上でのみ扱う。
  const ciphertext = CryptoJS.AES.encrypt(JSON.stringify(tripData), sitePassword).toString();
  await fs.writeFile(OUTPUT_DATA_FILE, JSON.stringify({ ciphertext }), "utf-8");

  console.log(`[fetch-notion] 完了: イベント${events.length}件、警告${warningCount}件`);
  console.log(`[fetch-notion] 出力先: ${OUTPUT_DATA_FILE}（暗号化済み）`);
}

main().catch((err) => {
  console.error("[fetch-notion] 致命的エラー:", err);
  process.exit(1);
});
