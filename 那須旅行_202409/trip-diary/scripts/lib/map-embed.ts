const SHORT_LINK_HOSTS = new Set(["maps.app.goo.gl", "goo.gl"]);

async function resolveShortLink(url: URL): Promise<URL | null> {
  try {
    const res = await fetch(url.toString(), { redirect: "follow" });
    // レスポンスボディは不要なので即座に破棄する
    await res.body?.cancel();
    return new URL(res.url);
  } catch (err) {
    console.warn(`[map-embed] 短縮URLの解決に失敗: ${url.toString()} (${String(err)})`);
    return null;
  }
}

function extractPlaceQuery(url: URL): string | null {
  const qParam = url.searchParams.get("q");
  if (qParam) {
    return qParam;
  }

  const placeMatch = url.pathname.match(/\/maps\/place\/([^/]+)/);
  if (placeMatch) {
    return decodeURIComponent(placeMatch[1].replace(/\+/g, " "));
  }

  const atMatch = url.pathname.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
  if (atMatch) {
    return `${atMatch[1]},${atMatch[2]}`;
  }

  return null;
}

export async function toMapEmbed(rawUrl: string | undefined): Promise<string | null> {
  if (!rawUrl) {
    return null;
  }

  let url: URL;
  try {
    url = new URL(rawUrl);
  } catch {
    return null;
  }

  if (SHORT_LINK_HOSTS.has(url.hostname)) {
    const resolved = await resolveShortLink(url);
    if (!resolved) {
      return null;
    }
    url = resolved;
  }

  if (!url.hostname.endsWith("google.com") && !url.hostname.endsWith("google.co.jp")) {
    return null;
  }

  const query = extractPlaceQuery(url);
  if (!query) {
    return null;
  }

  return `https://www.google.com/maps?q=${encodeURIComponent(query)}&output=embed`;
}
