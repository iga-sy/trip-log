import type { TripEvent } from "../types/trip";
import { dayKey, formatDayHeading } from "../utils/date";
import TimelineItem from "./TimelineItem";

interface TimelineProps {
  events: TripEvent[];
}

export default function Timeline({ events }: TimelineProps) {
  if (events.length === 0) {
    return null;
  }

  const groups = new Map<string, TripEvent[]>();
  for (const event of events) {
    const key = dayKey(event.dateISO);
    const list = groups.get(key) ?? [];
    list.push(event);
    groups.set(key, list);
  }

  return (
    <section>
      <h2 className="mb-6 text-2xl font-bold">旅程</h2>
      <div className="space-y-10">
        {[...groups.entries()].map(([key, dayEvents]) => (
          <div key={key}>
            <h3 className="mb-4 text-lg font-semibold text-ink/80">
              {formatDayHeading(dayEvents[0].dateISO)}
            </h3>
            <ol className="relative ml-3 space-y-6 border-l-2 border-accent/20 pl-6">
              {dayEvents.map((event) => (
                <TimelineItem key={event.id} event={event} />
              ))}
            </ol>
          </div>
        ))}
      </div>
    </section>
  );
}
