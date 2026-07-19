import type { TripData } from "../types/trip";
import { formatDayHeading } from "../utils/date";

interface HeroProps {
  tripData: TripData;
}

export default function Hero({ tripData }: HeroProps) {
  const { tripTitle, heroImage, events } = tripData;
  const firstDate = events[0]?.dateISO;
  const lastDate = events[events.length - 1]?.dateISO;

  return (
    <header
      className={`relative flex h-[60vh] min-h-[360px] items-end justify-center bg-cover bg-center ${
        heroImage ? "" : "bg-gradient-to-br from-sky-400 via-emerald-300 to-amber-200"
      }`}
      style={heroImage ? { backgroundImage: `url(${import.meta.env.BASE_URL}${heroImage})` } : undefined}
    >
      {heroImage && <div className="absolute inset-0 bg-black/40" />}
      <div
        className={`relative z-10 px-6 pb-10 text-center ${heroImage ? "text-white" : "text-slate-900"}`}
      >
        <h1 className="text-3xl font-bold tracking-wide sm:text-4xl">{tripTitle}</h1>
        {firstDate && (
          <p className="mt-2 text-sm opacity-90 sm:text-base">
            {formatDayHeading(firstDate)}
            {lastDate && lastDate !== firstDate ? ` 〜 ${formatDayHeading(lastDate)}` : ""}
          </p>
        )}
      </div>
    </header>
  );
}
