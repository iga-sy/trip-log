import type { TripComment, TripEvent } from "../types/trip";
import PhotoGrid, { type Photo } from "./PhotoGrid";

interface PhotoSidebarProps {
  events: TripEvent[];
  overallComments: TripComment[];
}

export default function PhotoSidebar({ events, overallComments }: PhotoSidebarProps) {
  const eventPhotos: Photo[] = events.flatMap((event) =>
    event.photos.map((photo) => ({ src: photo, alt: event.title })),
  );
  const commentPhotos: Photo[] = overallComments.flatMap((comment) =>
    comment.photos.map((photo) => ({ src: photo, alt: comment.name || "みんなの感想" })),
  );
  const photos: Photo[] = [...eventPhotos, ...commentPhotos];

  if (photos.length === 0) {
    return null;
  }

  return (
    <section className="max-h-[calc(100vh-4rem)] overflow-y-auto pr-1">
      <h2 className="mb-6 text-2xl font-bold">写真</h2>
      <PhotoGrid photos={photos} />
    </section>
  );
}
