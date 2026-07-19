import type { TripEvent } from "../types/trip";
import PhotoGrid, { type Photo } from "./PhotoGrid";
import VideoPlayer from "./VideoPlayer";

interface MediaGalleryProps {
  events: TripEvent[];
}

export default function MediaGallery({ events }: MediaGalleryProps) {
  const photos: Photo[] = events.flatMap((event) =>
    event.photos.map((photo) => ({ src: photo, alt: event.title })),
  );
  const videos = events.filter((event) => event.videoEmbedUrl);

  if (photos.length === 0 && videos.length === 0) {
    return null;
  }

  return (
    <section>
      <h2 className="mb-6 text-2xl font-bold">写真・動画</h2>
      {photos.length > 0 && <PhotoGrid photos={photos} />}
      {videos.length > 0 && (
        <div className="mt-8 space-y-6">
          {videos.map((event) => (
            <VideoPlayer key={event.id} event={event} />
          ))}
        </div>
      )}
    </section>
  );
}
