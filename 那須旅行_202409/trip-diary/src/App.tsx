import { useState } from "react";
import type { TripsFile } from "./types/trip";
import PasswordGate from "./components/PasswordGate";
import Hero from "./components/Hero";
import Timeline from "./components/Timeline";
import PhotoSidebar from "./components/PhotoSidebar";
import OverallComments from "./components/OverallComments";
import TripMap from "./components/TripMap";
import TripTabs from "./components/TripTabs";

export default function App() {
  const [tripsFile, setTripsFile] = useState<TripsFile | null>(null);
  const [activeTripId, setActiveTripId] = useState<string | null>(null);

  if (!tripsFile) {
    return (
      <PasswordGate
        onUnlock={(data) => {
          setTripsFile(data);
          setActiveTripId(data.trips[0]?.id ?? null);
        }}
      />
    );
  }

  const tripData =
    tripsFile.trips.find((trip) => trip.id === activeTripId) ?? tripsFile.trips[0];

  if (!tripData) {
    return null;
  }

  return (
    <div className="min-h-screen bg-base text-ink">
      <TripTabs
        trips={tripsFile.trips}
        activeTripId={tripData.id}
        onSelect={setActiveTripId}
      />
      <Hero tripData={tripData} />
      <main className="mx-auto max-w-5xl px-4 py-12">
        <div className="flex flex-col gap-12 md:flex-row md:items-start">
          <div className="order-2 md:sticky md:top-8 md:order-1 md:w-2/5">
            <PhotoSidebar overallComments={tripData.overallComments} />
          </div>
          <div className="order-1 md:order-2 md:w-3/5">
            <Timeline events={tripData.events} />
          </div>
        </div>
        <div className="mt-16">
          <OverallComments comments={tripData.overallComments} />
        </div>
        <div className="mt-16">
          <TripMap events={tripData.events} />
        </div>
      </main>
      <footer className="py-8 text-center text-xs text-ink/50">
        最終更新: {new Date(tripData.generatedAt).toLocaleString("ja-JP")}
      </footer>
    </div>
  );
}
