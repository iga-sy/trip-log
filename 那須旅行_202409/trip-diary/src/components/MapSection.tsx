import type { TripEvent } from "../types/trip";

interface MapSectionProps {
  events: TripEvent[];
}

export default function MapSection({ events }: MapSectionProps) {
  const withMap = events.filter((event) => event.mapUrl);

  if (withMap.length === 0) {
    return null;
  }

  return (
    <section>
      <h2 className="mb-6 text-2xl font-bold">地図</h2>
      <div className="space-y-6">
        {withMap.map((event) => (
          <div key={event.id}>
            <p className="mb-2 text-sm font-medium text-slate-700">{event.title}</p>
            {event.mapEmbedUrl ? (
              <div className="aspect-video overflow-hidden rounded-lg">
                <iframe
                  src={event.mapEmbedUrl}
                  title={`${event.title}の地図`}
                  className="h-full w-full border-0"
                  loading="lazy"
                />
              </div>
            ) : (
              <a
                href={event.mapUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block rounded-md bg-sky-600 px-4 py-2 text-sm font-medium text-white hover:bg-sky-700"
              >
                ルート案内を開く
              </a>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
