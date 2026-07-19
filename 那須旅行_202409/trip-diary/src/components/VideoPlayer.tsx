import type { TripEvent } from "../types/trip";

interface VideoPlayerProps {
  event: TripEvent;
}

export default function VideoPlayer({ event }: VideoPlayerProps) {
  if (!event.videoEmbedUrl) {
    return null;
  }

  return (
    <div>
      <p className="mb-2 text-sm font-medium text-slate-700">{event.title}</p>
      <div className="aspect-video overflow-hidden rounded-lg bg-black">
        <iframe
          src={event.videoEmbedUrl}
          title={event.title}
          className="h-full w-full"
          allow={
            event.videoEmbedType === "youtube"
              ? "autoplay; encrypted-media; picture-in-picture"
              : "autoplay"
          }
          allowFullScreen
          loading="lazy"
        />
      </div>
    </div>
  );
}
