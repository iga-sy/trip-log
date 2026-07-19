import { useState } from "react";
import Lightbox from "./Lightbox";

export interface Photo {
  src: string;
  alt: string;
}

interface PhotoGridProps {
  photos: Photo[];
}

export default function PhotoGrid({ photos }: PhotoGridProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
        {photos.map((photo, index) => (
          <button
            key={`${photo.src}-${index}`}
            type="button"
            onClick={() => setOpenIndex(index)}
            className="aspect-square overflow-hidden rounded-lg"
          >
            <img
              src={`${import.meta.env.BASE_URL}${photo.src}`}
              alt={photo.alt}
              loading="lazy"
              className="h-full w-full object-cover transition-transform hover:scale-105"
            />
          </button>
        ))}
      </div>
      {openIndex !== null && (
        <Lightbox photos={photos} index={openIndex} onClose={() => setOpenIndex(null)} onNavigate={setOpenIndex} />
      )}
    </>
  );
}
