import type { Photo } from "./PhotoGrid";

interface LightboxProps {
  photos: Photo[];
  index: number;
  onClose: () => void;
  onNavigate: (index: number) => void;
}

export default function Lightbox({ photos, index, onClose, onNavigate }: LightboxProps) {
  const photo = photos[index];
  const goPrev = () => onNavigate((index - 1 + photos.length) % photos.length);
  const goNext = () => onNavigate((index + 1) % photos.length);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onClose();
        }}
        className="absolute right-4 top-4 text-3xl text-white"
        aria-label="閉じる"
      >
        ×
      </button>
      {photos.length > 1 && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            goPrev();
          }}
          className="absolute left-2 text-3xl text-white sm:left-6"
          aria-label="前の写真"
        >
          ‹
        </button>
      )}
      <img
        src={`${import.meta.env.BASE_URL}${photo.src}`}
        alt={photo.alt}
        className="max-h-full max-w-full object-contain"
        onClick={(e) => e.stopPropagation()}
      />
      {photos.length > 1 && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            goNext();
          }}
          className="absolute right-2 text-3xl text-white sm:right-6"
          aria-label="次の写真"
        >
          ›
        </button>
      )}
    </div>
  );
}
