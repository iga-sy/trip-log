import type { TripEvent } from "../types/trip";
import PhotoGrid, { type Photo } from "./PhotoGrid";

interface PhotoSidebarProps {
  events: TripEvent[];
}

export default function PhotoSidebar({ events }: PhotoSidebarProps) {
  const photos: Photo[] = events.flatMap((event) =>
    event.photos.map((photo) => ({ src: photo, alt: event.title })),
  );

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
