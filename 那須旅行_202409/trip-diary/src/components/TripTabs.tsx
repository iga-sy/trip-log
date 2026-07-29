interface TripTabsProps {
  trips: { id: string; label: string }[];
  activeTripId: string;
  onSelect: (id: string) => void;
}

export default function TripTabs({ trips, activeTripId, onSelect }: TripTabsProps) {
  if (trips.length <= 1) {
    return null;
  }

  return (
    <nav className="sticky top-0 z-20 flex gap-1 overflow-x-auto bg-white/95 px-4 py-2 shadow-sm backdrop-blur">
      {trips.map((trip) => (
        <button
          key={trip.id}
          type="button"
          onClick={() => onSelect(trip.id)}
          className={`shrink-0 rounded-full px-4 py-1.5 text-sm font-medium transition ${
            trip.id === activeTripId
              ? "bg-sky-600 text-white"
              : "text-slate-600 hover:bg-slate-100"
          }`}
        >
          {trip.label}
        </button>
      ))}
    </nav>
  );
}
