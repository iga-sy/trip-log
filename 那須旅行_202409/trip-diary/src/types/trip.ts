export interface TripComment {
  name: string;
  text: string;
  photos: string[];
}

export interface TripEvent {
  id: string;
  title: string;
  dateISO: string;
  hasTime: boolean;
  memo: string;
  shopUrl?: string;
  comments: TripComment[];
  photos: string[];
  coords: { lat: number; lng: number } | null;
}

export interface TripData {
  tripTitle: string;
  heroImage: string | null;
  generatedAt: string;
  events: TripEvent[];
  overallComments: TripComment[];
}

export interface TripSummary extends TripData {
  id: string;
  label: string;
}

export interface TripsFile {
  trips: TripSummary[];
}
