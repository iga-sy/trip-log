import type { TripEvent } from "../types/trip";
import { formatTime } from "../utils/date";

interface TimelineItemProps {
  event: TripEvent;
}

export default function TimelineItem({ event }: TimelineItemProps) {
  return (
    <li className="relative">
      <span className="absolute -left-[calc(1.5rem+5px)] top-1.5 h-3 w-3 rounded-full bg-emerald-500" />
      <div className="flex flex-wrap items-baseline gap-2">
        {event.hasTime && (
          <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-800">
            {formatTime(event.dateISO)}
          </span>
        )}
        <h4 className="text-base font-semibold">{event.title}</h4>
      </div>
      {event.memo && <p className="mt-1 whitespace-pre-wrap text-sm text-slate-600">{event.memo}</p>}
      {event.photos.length > 0 && (
        <div className="mt-3 flex gap-2 overflow-x-auto">
          {event.photos.map((photo) => (
            <img
              key={photo}
              src={`${import.meta.env.BASE_URL}${photo}`}
              alt={event.title}
              loading="lazy"
              className="h-20 w-20 flex-shrink-0 rounded-md object-cover"
            />
          ))}
        </div>
      )}
      {event.mapUrl && (
        <a
          href={event.mapUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-2 inline-block text-sm text-sky-600 underline underline-offset-2"
        >
          地図を見る
        </a>
      )}
    </li>
  );
}
