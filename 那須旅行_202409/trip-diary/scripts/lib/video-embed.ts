export interface VideoEmbed {
  embedUrl: string | null;
  type: "youtube" | "drive" | "unknown";
}

function extractYoutubeId(url: URL): string | null {
  if (url.hostname === "youtu.be") {
    const id = url.pathname.slice(1);
    return id || null;
  }
  if (url.hostname.endsWith("youtube.com")) {
    if (url.pathname === "/watch") {
      return url.searchParams.get("v");
    }
    const shortsMatch = url.pathname.match(/^\/(shorts|embed)\/([^/]+)/);
    if (shortsMatch) {
      return shortsMatch[2];
    }
  }
  return null;
}

function extractDriveId(url: URL): string | null {
  if (!url.hostname.endsWith("drive.google.com")) {
    return null;
  }
  const fileMatch = url.pathname.match(/\/file\/d\/([^/]+)/);
  if (fileMatch) {
    return fileMatch[1];
  }
  const idParam = url.searchParams.get("id");
  return idParam;
}

export function toVideoEmbed(rawUrl: string | undefined): VideoEmbed {
  if (!rawUrl) {
    return { embedUrl: null, type: "unknown" };
  }

  let url: URL;
  try {
    url = new URL(rawUrl);
  } catch {
    return { embedUrl: null, type: "unknown" };
  }

  const youtubeId = extractYoutubeId(url);
  if (youtubeId) {
    return {
      embedUrl: `https://www.youtube-nocookie.com/embed/${youtubeId}`,
      type: "youtube",
    };
  }

  const driveId = extractDriveId(url);
  if (driveId) {
    return {
      embedUrl: `https://drive.google.com/file/d/${driveId}/preview`,
      type: "drive",
    };
  }

  return { embedUrl: null, type: "unknown" };
}
