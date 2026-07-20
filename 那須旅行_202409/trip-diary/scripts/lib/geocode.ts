// Nominatim利用規約: 明確なUser-Agentを送り、リクエスト間隔を1秒以上space空ける
const NOMINATIM_MIN_INTERVAL_MS = 1100;
const NOMINATIM_USER_AGENT = "trip-diary-build-script/1.0 (family travel diary site)";

let lastNominatimRequestAt = 0;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export interface Coordinates {
  lat: number;
  lng: number;
}

export async function geocode(query: string): Promise<Coordinates | null> {
  const trimmed = query.trim();
  if (!trimmed) {
    return null;
  }

  const elapsed = Date.now() - lastNominatimRequestAt;
  if (elapsed < NOMINATIM_MIN_INTERVAL_MS) {
    await sleep(NOMINATIM_MIN_INTERVAL_MS - elapsed);
  }
  lastNominatimRequestAt = Date.now();

  try {
    const endpoint = `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(trimmed)}`;
    const res = await fetch(endpoint, { headers: { "User-Agent": NOMINATIM_USER_AGENT } });
    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`);
    }
    const results = (await res.json()) as { lat: string; lon: string }[];
    const first = results[0];
    if (!first) {
      return null;
    }
    return { lat: Number.parseFloat(first.lat), lng: Number.parseFloat(first.lon) };
  } catch (err) {
    console.warn(`[geocode] ジオコーディング失敗: "${trimmed}" (${String(err)})`);
    return null;
  }
}
