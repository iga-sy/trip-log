const NOTION_VERSION = "2022-06-28";
const NOTION_API_BASE = "https://api.notion.com/v1";

function notionHeaders(apiKey: string, extra?: Record<string, string>) {
  return {
    Authorization: `Bearer ${apiKey}`,
    "Notion-Version": NOTION_VERSION,
    ...extra,
  };
}

export interface NotionFileUpload {
  id: string;
  name: string;
}

/**
 * Notion File Upload APIでファイルをアップロードする。
 * アップロード済みfile_uploadは1時間以内にページへ紐付けないと失効する。
 */
export async function uploadFileToNotion(
  apiKey: string,
  buffer: Buffer,
  contentType: string,
  filename: string,
): Promise<NotionFileUpload> {
  const createRes = await fetch(`${NOTION_API_BASE}/file_uploads`, {
    method: "POST",
    headers: notionHeaders(apiKey, { "Content-Type": "application/json" }),
    body: JSON.stringify({}),
  });
  if (!createRes.ok) {
    throw new Error(`Notion file_uploads作成失敗: status=${createRes.status} body=${await createRes.text()}`);
  }
  const created = (await createRes.json()) as { id: string; upload_url: string };

  const form = new FormData();
  form.append("file", new Blob([buffer], { type: contentType }), filename);

  const sendRes = await fetch(created.upload_url, {
    method: "POST",
    headers: notionHeaders(apiKey),
    body: form,
  });
  if (!sendRes.ok) {
    throw new Error(`Notion file_upload送信失敗: status=${sendRes.status} body=${await sendRes.text()}`);
  }

  return { id: created.id, name: filename };
}

export async function createPage(
  apiKey: string,
  databaseId: string,
  properties: Record<string, unknown>,
): Promise<void> {
  const res = await fetch(`${NOTION_API_BASE}/pages`, {
    method: "POST",
    headers: notionHeaders(apiKey, { "Content-Type": "application/json" }),
    body: JSON.stringify({
      parent: { database_id: databaseId },
      properties,
    }),
  });

  if (!res.ok) {
    throw new Error(`Notion pages.create失敗: status=${res.status} body=${await res.text()}`);
  }
}
