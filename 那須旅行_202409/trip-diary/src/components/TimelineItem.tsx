import type { TripEvent } from "../types/trip";
import { formatTime } from "../utils/date";

interface TimelineItemProps {
  event: TripEvent;
}

export default function TimelineItem({ event }: TimelineItemProps) {
  return (
    <li className="relative">
      <span className="absolute -left-[calc(1.5rem_+_5px)] top-1.5 h-3 w-3 rounded-full bg-emerald-500" />
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-baseline gap-2">
            {event.hasTime && (
              <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-800">
                {formatTime(event.dateISO)}
              </span>
            )}
            {event.shopUrl ? (
              <a
                href={event.shopUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-base font-semibold text-sky-700 underline underline-offset-2"
              >
                {event.title}
              </a>
            ) : (
              <h4 className="text-base font-semibold">{event.title}</h4>
            )}
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
        </div>
        {event.comments.length > 0 && (
          <ul className="space-y-1 border-l-2 border-slate-200 pl-3 sm:w-56 sm:flex-shrink-0">
            {event.comments.map((comment) => (
              <li key={comment.name} className="text-sm text-slate-600">
                <span className="font-medium text-slate-700">{comment.name}: </span>
                <span className="whitespace-pre-wrap">{comment.text}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </li>
  );
}
