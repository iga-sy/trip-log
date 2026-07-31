import PhotoGrid, { type Photo } from "./PhotoGrid";

interface PhotoSidebarProps {
  albumPhotos: string[];
}

export default function PhotoSidebar({ albumPhotos }: PhotoSidebarProps) {
  const photos: Photo[] = albumPhotos.map((photo) => ({ src: photo, alt: "アルバム" }));

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
