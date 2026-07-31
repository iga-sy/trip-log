import type { TripComment } from "../types/trip";
import PhotoGrid, { type Photo } from "./PhotoGrid";

interface PhotoSidebarProps {
  overallComments: TripComment[];
}

export default function PhotoSidebar({ overallComments }: PhotoSidebarProps) {
  const photos: Photo[] = overallComments.flatMap((comment) =>
    comment.photos.map((photo) => ({ src: photo, alt: comment.name || "みんなの感想" })),
  );

  if (photos.length === 0) {
    return null;
  }

  return (
    <section className="max-h-[calc(100vh-4rem)] overflow-y-auto pr-1">
      <h2 className="mb-6 text-2xl font-bold">アルバム</h2>
      <PhotoGrid photos={photos} />
    </section>
  );
}
