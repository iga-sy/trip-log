import tripDataRaw from "./data/trip-data.json";
import type { TripData } from "./types/trip";
import Hero from "./components/Hero";
import Timeline from "./components/Timeline";
import MediaGallery from "./components/MediaGallery";
import MapSection from "./components/MapSection";

const tripData = tripDataRaw as TripData;

export default function App() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <Hero tripData={tripData} />
      <main className="mx-auto max-w-3xl space-y-16 px-4 py-12">
        <Timeline events={tripData.events} />
        <MediaGallery events={tripData.events} />
        <MapSection events={tripData.events} />
      </main>
      <footer className="py-8 text-center text-xs text-slate-400">
        最終更新: {new Date(tripData.generatedAt).toLocaleString("ja-JP")}
      </footer>
    </div>
  );
}
