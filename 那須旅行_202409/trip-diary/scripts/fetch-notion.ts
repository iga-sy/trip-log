import { fileURLToPath } from "node:url";
import path from "node:path";
import fs from "node:fs/promises";
import * as dotenv from "dotenv";
import CryptoJS from "crypto-js";
import { Client, isFullPage } from "@notionhq/client";
import type { PageObjectResponse } from "@notionhq/client/build/src/api-endpoints";
import { geocode } from "./lib/geocode.ts";
import type { TripComment, TripEvent, TripSummary, TripsFile } from "../src/types/trip.ts";

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Notion側のプロパティ名が変わった場合はここだけ直せばよい
// 「メモ」に相当する列は無いため、memoは常に空文字列として扱う。
// tripName列（タイトル型）は、複数の旅行を1つのDBで区別するための旅行名が入る。
const PROPERTY_NAMES = {
  tripName: "旅行名",
  title: "スポット名",
  date: "日時",
  shopLink: "リンク",
  photos: "写真",
} as const;

// 「全体の感想」データベースのプロパティ名
// tripName列（"投稿者"という名前だが、実際には旅行名を区別するためのタイトル型プロパティ）は
// 複数の旅行を1つのDBで区別するための旅行名が入る。
// 投稿者本人はマルチセレクト列で管理する（LINE経由の代筆投稿のため表示名を使えないので、
// 本文先頭の名前プレフィックスで判定した結果がここに入る）。
const COMMENTS_DB_PROPERTY_NAMES = {
  tripName: "投稿者",
  author: "マルチセレクト",
  text: "メモ",
  photos: "写真",
} as const;

const FAMILY_MEMBERS = ["修", "美", "悠", "紗"] as const;

const FALLBACK_TRIP_NAME = "無題の旅行";

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

function getPlainText(richText: { plain_text: string }[]): string {
  return richText.map((t) => t.plain_text).join("");
}

function extractTripName(page: PageObjectResponse, propertyName: string): string {
  const prop = page.properties[propertyName];
  if (prop?.type === "title") {
    const text = getPlainText(prop.title).trim();
    return text || FALLBACK_TRIP_NAME;
  }
  return FALLBACK_TRIP_NAME;
}

function extractTitle(page: PageObjectResponse): string {
  const prop = page.properties[PROPERTY_NAMES.title];
  if (prop?.type === "rich_text") {
    return getPlainText(prop.rich_text) || "(無題)";
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
    const prop = page.properties[name];
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

function groupByTripName(
  pages: PageObjectResponse[],
  tripNamePropertyName: string,
): Map<string, PageObjectResponse[]> {
  const groups = new Map<string, PageObjectResponse[]>();
  for (const page of pages) {
    const tripName = extractTripName(page, tripNamePropertyName);
    const group = groups.get(tripName) ?? [];
    group.push(page);
    groups.set(tripName, group);
  }
  return groups;
}

async function buildEventsForTrip(pages: PageObjectResponse[]): Promise<{
  events: TripEvent[];
  warningCount: number;
}> {
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

    const memo = ""; // 「メモ」に相当する列が無いため常に空文字列
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

  return { events, warningCount };
}

async function buildCommentsForTrip(pages: PageObjectResponse[]): Promise<TripComment[]> {
  const comments: TripComment[] = [];
  for (const page of pages) {
    const authorProp = page.properties[COMMENTS_DB_PROPERTY_NAMES.author];
    const textProp = page.properties[COMMENTS_DB_PROPERTY_NAMES.text];

    const name =
      authorProp?.type === "multi_select"
        ? authorProp.multi_select.map((option) => option.name).join(", ")
        : undefined;
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
  const [schedulePages, commentPages] = await Promise.all([
    queryAllPages(notion, databaseId, [{ property: PROPERTY_NAMES.date, direction: "ascending" }]),
    queryAllPages(notion, commentsDatabaseId, [
      { timestamp: "created_time", direction: "ascending" },
    ]),
  ]);
  console.log(`[fetch-notion] ${schedulePages.length} 件の予定、${commentPages.length} 件の全体感想を取得しました`);

  const scheduleGroups = groupByTripName(schedulePages, PROPERTY_NAMES.tripName);
  const commentGroups = groupByTripName(commentPages, COMMENTS_DB_PROPERTY_NAMES.tripName);

  const tripNames = new Set<string>([...scheduleGroups.keys(), ...commentGroups.keys()]);

  const trips: TripSummary[] = [];
  let totalWarningCount = 0;

  for (const tripName of tripNames) {
    const { events, warningCount } = await buildEventsForTrip(scheduleGroups.get(tripName) ?? []);
    const overallComments = await buildCommentsForTrip(commentGroups.get(tripName) ?? []);
    totalWarningCount += warningCount;

    const heroEvent = events.find((event) => event.photos.length > 0);

    trips.push({
      id: tripName,
      label: tripName,
      tripTitle: tripName,
      heroImage: heroEvent ? heroEvent.photos[0] : null,
      generatedAt: new Date().toISOString(),
      events,
      overallComments,
    });
  }

  trips.sort((a, b) => {
    const aFirst = a.events[0]?.dateISO ?? "";
    const bFirst = b.events[0]?.dateISO ?? "";
    return aFirst.localeCompare(bFirst);
  });

  const tripsFile: TripsFile = { trips };

  // dataは暗号化してからpublic/配下に書き出す。復号鍵(SITE_PASSWORD)はビルドログにも
  // 出力に含めない。平文JSONはディスクにも残さずメモリ上でのみ扱う。
  const ciphertext = CryptoJS.AES.encrypt(JSON.stringify(tripsFile), sitePassword).toString();
  await fs.writeFile(OUTPUT_DATA_FILE, JSON.stringify({ ciphertext }), "utf-8");

  console.log(
    `[fetch-notion] 完了: 旅行${trips.length}件、警告${totalWarningCount}件`,
  );
  console.log(`[fetch-notion] 出力先: ${OUTPUT_DATA_FILE}（暗号化済み）`);
}

main().catch((err) => {
  console.error("[fetch-notion] 致命的エラー:", err);
  process.exit(1);
});
